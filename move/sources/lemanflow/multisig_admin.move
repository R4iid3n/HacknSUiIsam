// LémanFlow Multi-sig Admin Module
// Allows multiple administrators to manage an event with threshold signatures
// Feature: Native Multi-sig for collaborative event management

module sui_hackathon::multisig_admin {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::vec_set::{Self, VecSet};
    use sui_hackathon::event::{Self, Event, EventAdminCap};

    /// Multi-sig admin configuration for an event
    public struct MultiSigAdmin has key, store {
        id: UID,
        event_id: ID,
        admins: VecSet<address>, // Set of admin addresses
        threshold: u64, // Minimum signatures required
        pending_actions: VecSet<ID>, // Pending multi-sig actions
    }

    /// Pending action that requires multi-sig approval
    public struct PendingAction has key, store {
        id: UID,
        action_type: vector<u8>, // "create_mission", "fund_event", etc.
        proposer: address,
        approvals: VecSet<address>,
        data: vector<u8>, // Serialized action data
        executed: bool,
    }

    /// Admin permission capability
    public struct AdminPermission has key {
        id: UID,
        multisig_id: ID,
        admin: address,
    }

    /// Events
    public struct MultiSigCreated has copy, drop {
        multisig_id: ID,
        event_id: ID,
        admins: vector<address>,
        threshold: u64,
    }

    public struct ActionProposed has copy, drop {
        action_id: ID,
        multisig_id: ID,
        proposer: address,
        action_type: vector<u8>,
    }

    public struct ActionApproved has copy, drop {
        action_id: ID,
        approver: address,
        total_approvals: u64,
    }

    public struct ActionExecuted has copy, drop {
        action_id: ID,
        executor: address,
    }

    /// Error codes
    const ENotAdmin: u64 = 1;
    const EInvalidThreshold: u64 = 2;
    const EAlreadyApproved: u64 = 3;
    const EInsufficientApprovals: u64 = 4;
    const EAlreadyExecuted: u64 = 5;
    const ENotProposer: u64 = 6;

    /// Create multi-sig admin for an event
    /// Replaces single EventAdminCap with multi-sig governance
    public fun create_multisig(
        event_id: ID,
        admins: vector<address>,
        threshold: u64,
        ctx: &mut TxContext
    ) {
        let num_admins = vector::length(&admins);
        assert!(threshold > 0 && threshold <= num_admins, EInvalidThreshold);

        let multisig_uid = object::new(ctx);
        let multisig_id = object::uid_to_inner(&multisig_uid);

        let mut admins_set = vec_set::empty<address>();
        let mut i = 0;
        while (i < num_admins) {
            vec_set::insert(&mut admins_set, *vector::borrow(&admins, i));
            i = i + 1;
        };

        let multisig = MultiSigAdmin {
            id: multisig_uid,
            event_id,
            admins: admins_set,
            threshold,
            pending_actions: vec_set::empty(),
        };

        // Create permission for each admin
        i = 0;
        while (i < num_admins) {
            let admin_addr = *vector::borrow(&admins, i);
            let permission = AdminPermission {
                id: object::new(ctx),
                multisig_id,
                admin: admin_addr,
            };
            transfer::transfer(permission, admin_addr);
            i = i + 1;
        };

        sui::event::emit(MultiSigCreated {
            multisig_id,
            event_id,
            admins,
            threshold,
        });

        transfer::share_object(multisig);
    }

    /// Propose an action (e.g., create mission, fund event)
    public fun propose_action(
        multisig: &mut MultiSigAdmin,
        _permission: &AdminPermission,
        action_type: vector<u8>,
        action_data: vector<u8>,
        ctx: &mut TxContext
    ) {
        let proposer = tx_context::sender(ctx);
        assert!(vec_set::contains(&multisig.admins, &proposer), ENotAdmin);

        let action_uid = object::new(ctx);
        let action_id = object::uid_to_inner(&action_uid);

        let mut approvals = vec_set::empty<address>();
        vec_set::insert(&mut approvals, proposer); // Proposer auto-approves

        let action = PendingAction {
            id: action_uid,
            action_type: action_type,
            proposer,
            approvals,
            data: action_data,
            executed: false,
        };

        vec_set::insert(&mut multisig.pending_actions, action_id);

        sui::event::emit(ActionProposed {
            action_id,
            multisig_id: object::id(multisig),
            proposer,
            action_type: action_type,
        });

        transfer::share_object(action);
    }

    /// Approve a pending action
    public fun approve_action(
        multisig: &MultiSigAdmin,
        action: &mut PendingAction,
        _permission: &AdminPermission,
        ctx: &mut TxContext
    ) {
        let approver = tx_context::sender(ctx);
        assert!(vec_set::contains(&multisig.admins, &approver), ENotAdmin);
        assert!(!action.executed, EAlreadyExecuted);
        assert!(!vec_set::contains(&action.approvals, &approver), EAlreadyApproved);

        vec_set::insert(&mut action.approvals, approver);

        sui::event::emit(ActionApproved {
            action_id: object::id(action),
            approver,
            total_approvals: vec_set::size(&action.approvals),
        });
    }

    /// Execute action after threshold approvals reached
    public fun execute_action(
        multisig: &mut MultiSigAdmin,
        action: &mut PendingAction,
        _permission: &AdminPermission,
        ctx: &mut TxContext
    ) {
        let executor = tx_context::sender(ctx);
        assert!(vec_set::contains(&multisig.admins, &executor), ENotAdmin);
        assert!(!action.executed, EAlreadyExecuted);

        let approvals_count = vec_set::size(&action.approvals);
        assert!(approvals_count >= multisig.threshold, EInsufficientApprovals);

        action.executed = true;

        // Remove from pending
        vec_set::remove(&mut multisig.pending_actions, &object::id(action));

        sui::event::emit(ActionExecuted {
            action_id: object::id(action),
            executor,
        });

        // Note: Actual execution (create_mission, fund_event, etc.)
        // happens in separate transaction after this approval
    }

    /// Check if action has enough approvals
    public fun has_threshold_approvals(
        multisig: &MultiSigAdmin,
        action: &PendingAction
    ): bool {
        vec_set::size(&action.approvals) >= multisig.threshold
    }

    /// Get action data for execution
    public fun get_action_data(action: &PendingAction): vector<u8> {
        action.data
    }

    /// Check if address is admin
    public fun is_admin(multisig: &MultiSigAdmin, addr: address): bool {
        vec_set::contains(&multisig.admins, &addr)
    }

    /// Get threshold
    public fun get_threshold(multisig: &MultiSigAdmin): u64 {
        multisig.threshold
    }

    /// Get number of admins
    public fun get_admin_count(multisig: &MultiSigAdmin): u64 {
        vec_set::size(&multisig.admins)
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        // Test initialization
    }
}

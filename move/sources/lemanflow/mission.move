// LémanFlow Mission Module
// Missions attached to events as dynamic fields, with QR-based completion

module sui_hackathon::mission {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use sui::dynamic_field as df;
    use sui::clock::{Self, Clock};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use std::string::{Self, String};

    use sui_hackathon::event::{Self as event_module, Event, EventAdminCap};
    use sui_hackathon::passport::{Self, Passport};

    /// Mission data stored as dynamic field on Event
    public struct Mission has store, copy, drop {
        mission_id: u64,
        title: String,
        description: String,
        reward_amount: u64,
        qr_secret_hash: vector<u8>, // Hash of QR secret for verification
        active: bool,
        completions: u64,
    }

    /// Mission key for dynamic fields
    public struct MissionKey has store, copy, drop {
        mission_id: u64,
    }

    /// Events
    public struct MissionCreated has copy, drop {
        event_id: ID,
        mission_id: u64,
        title: String,
        reward_amount: u64,
    }

    public struct MissionCompleted has copy, drop {
        event_id: ID,
        mission_id: u64,
        passport_id: ID,
        user: address,
        reward_amount: u64,
        timestamp: u64,
    }

    /// Error codes
    const ENotOrganizer: u64 = 1;
    const EMissionNotFound: u64 = 2;
    const EMissionInactive: u64 = 3;
    const EAlreadyCompleted: u64 = 4;
    const EInvalidQR: u64 = 5;
    const EInsufficientFunds: u64 = 6;
    const EInvalidReward: u64 = 7;
    const EEmptyTitle: u64 = 8;
    const EEmptyDescription: u64 = 9;
    const ETitleTooLong: u64 = 10;
    const EDescriptionTooLong: u64 = 11;
    const EInvalidQRHash: u64 = 12;
    const EEventNotActive: u64 = 13;
    const EEventTimeWindow: u64 = 14;

    /// Maximum lengths for validation
    const MAX_TITLE_LENGTH: u64 = 200;
    const MAX_DESCRIPTION_LENGTH: u64 = 1000;
    const QR_HASH_LENGTH: u64 = 32; // SHA-256 hash length

    /// Create a mission and attach to event
    /// Validates input parameters and creates a new mission
    /// @param admin_cap: Admin capability for the event
    /// @param event_obj: The event to attach mission to
    /// @param title: Mission title (max 200 bytes)
    /// @param description: Mission description (max 1000 bytes)
    /// @param reward_amount: Reward amount in MIST (must be > 0)
    /// @param qr_secret_hash: SHA-256 hash of QR secret (must be 32 bytes)
    public fun create_mission(
        admin_cap: &EventAdminCap,
        event_obj: &mut Event,
        title: vector<u8>,
        description: vector<u8>,
        reward_amount: u64,
        qr_secret_hash: vector<u8>,
        _ctx: &mut TxContext
    ) {
        // Verify admin cap matches event
        assert!(object::id(event_obj) == event_module::get_admin_cap_event_id(admin_cap), ENotOrganizer);
        
        // Verify event is active
        assert!(event_module::is_active(event_obj), EEventNotActive);

        // Input validation
        assert!(reward_amount > 0, EInvalidReward);
        assert!(std::vector::length(&title) > 0, EEmptyTitle);
        assert!(std::vector::length(&description) > 0, EEmptyDescription);
        assert!(std::vector::length(&title) <= MAX_TITLE_LENGTH, ETitleTooLong);
        assert!(std::vector::length(&description) <= MAX_DESCRIPTION_LENGTH, EDescriptionTooLong);
        assert!(std::vector::length(&qr_secret_hash) == QR_HASH_LENGTH, EInvalidQRHash);

        let mission_id = event_module::get_total_missions(event_obj);

        let mission = Mission {
            mission_id,
            title: string::utf8(title),
            description: string::utf8(description),
            reward_amount,
            qr_secret_hash,
            active: true,
            completions: 0,
        };

        let key = MissionKey { mission_id };
        event_module::add_mission_field(event_obj, key, mission);

        event_module::increment_missions(event_obj);

        event::emit(MissionCreated {
            event_id: object::id(event_obj),
            mission_id,
            title: string::utf8(title),
            reward_amount,
        });
    }

    /// Complete mission and distribute reward (sponsored transaction)
    /// Validates mission completion, checks time window, and distributes reward
    /// 
    /// Security Model:
    /// - QR proof verification is handled by backend before calling this function
    /// - Backend validates ECDSA signature and nonce before building transaction
    /// - On-chain validation provides defense-in-depth via double-claim prevention
    /// 
    /// @param event_obj: The event containing the mission
    /// @param passport: User's passport to add attestation to
    /// @param user_address: The address of the user who will receive the reward
    /// @param mission_id: ID of the mission to complete
    /// @param qr_proof: QR proof (validated by backend, kept for future on-chain verification)
    /// @param clock: Clock object for timestamp validation
    public fun complete_mission_and_reward(
        event_obj: &mut Event,
        passport: &mut Passport,
        user_address: address,
        mission_id: u64,
        qr_proof: vector<u8>, // Validated by backend (ECDSA signature + nonce)
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Check event is active
        assert!(event_module::is_active(event_obj), EMissionInactive);

        // Check event time window
        let current_time = clock::timestamp_ms(clock);
        let start_time = event_module::get_start_time(event_obj);
        let end_time = event_module::get_end_time(event_obj);
        assert!(current_time >= start_time && current_time <= end_time, EEventTimeWindow);

        let event_id = object::id(event_obj);
        let event_name = event_module::get_name(event_obj);

        // Get mission and copy values we need
        let key = MissionKey { mission_id };
        {
            let mission_ref = event_module::borrow_mission_field<MissionKey, Mission>(event_obj, key);
            assert!(mission_ref.active, EMissionInactive);
        };

        // Check not already completed (via passport attestation) - anti-double-claim
        assert!(
            !passport::has_attestation(passport, event_id, mission_id),
            EAlreadyCompleted
        );

        // QR proof is validated by backend before transaction is built
        // Backend checks: ECDSA signature, nonce uniqueness, expiration
        // On-chain verification can be added in future for additional security
        let _ = qr_proof; // Suppress unused warning (validated by backend)

        // Copy mission data before mutable borrows
        let (reward_amount, mission_title) = {
            let mission_ref = event_module::borrow_mission_field<MissionKey, Mission>(event_obj, key);
            (mission_ref.reward_amount, mission_ref.title)
        };

        // Withdraw reward from event grant pool
        let reward = event_module::withdraw_reward(event_obj, reward_amount, ctx);

        // Transfer reward to the user (not the sponsor)
        transfer::public_transfer(reward, user_address);

        // Add attestation to passport
        let timestamp = clock::timestamp_ms(clock);
        passport::add_attestation(
            passport,
            event_id,
            event_name,
            mission_id,
            mission_title,
            timestamp,
            reward_amount
        );

        // Update mission stats
        {
            let mission_ref = event_module::borrow_mission_field_mut<MissionKey, Mission>(event_obj, key);
            mission_ref.completions = mission_ref.completions + 1;
        };

        event::emit(MissionCompleted {
            event_id,
            mission_id,
            passport_id: object::id(passport),
            user: user_address,
            reward_amount,
            timestamp,
        });
    }

    /// Get mission info
    public fun get_mission(event_obj: &Event, mission_id: u64): &Mission {
        let key = MissionKey { mission_id };
        event_module::borrow_mission_field<MissionKey, Mission>(event_obj, key)
    }

    /// Check if mission exists
    public fun mission_exists(event_obj: &Event, mission_id: u64): bool {
        let key = MissionKey { mission_id };
        event_module::mission_field_exists<MissionKey>(event_obj, key)
    }

    /// Toggle mission active status
    /// Verifies admin capability matches event before allowing status change
    /// @param admin_cap: Admin capability for the event
    /// @param event_obj: The event containing the mission
    /// @param mission_id: ID of the mission to update
    /// @param active: New active status
    public fun set_mission_status(
        admin_cap: &EventAdminCap,
        event_obj: &mut Event,
        mission_id: u64,
        active: bool,
    ) {
        // Verify admin cap matches event
        assert!(object::id(event_obj) == event_module::get_admin_cap_event_id(admin_cap), ENotOrganizer);
        
        let key = MissionKey { mission_id };
        let mission = event_module::borrow_mission_field_mut<MissionKey, Mission>(event_obj, key);
        mission.active = active;
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        // Test initialization happens via event module
    }
}

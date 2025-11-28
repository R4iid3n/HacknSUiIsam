// LémanFlow AI Agent Module
// Agents IA pour automatiser les workflows d'événements
// Exploite l'architecture objet de Sui pour des agents autonomes

module sui_hackathon::ai_agent {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use sui::dynamic_field as df;
    use sui::clock::{Self, Clock};
    use std::string::{Self, String};
    use std::vector;

    /// AI Agent - Automatise les workflows d'événements
    public struct AIAgent has key, store {
        id: UID,
        name: String,
        event_id: ID,
        agent_type: u8, // 1=CheckIn, 2=Rewards, 3=Missions, 4=Analytics
        is_active: bool,
        created_at: u64,
        execution_count: u64,
        config: AgentConfig,
    }

    /// Configuration de l'agent
    public struct AgentConfig has store, copy, drop {
        auto_approve: bool,
        reward_multiplier: u64, // En pourcentage (100 = 1x, 200 = 2x)
        min_reward: u64,
        max_reward: u64,
        cooldown_period: u64, // En millisecondes
    }

    /// Règle d'automatisation
    public struct AutomationRule has store, copy, drop {
        rule_id: u64,
        trigger_type: u8, // 1=OnScan, 2=OnTime, 3=OnComplete, 4=OnThreshold
        action_type: u8, // 1=MintAttestation, 2=DistributeReward, 3=SendNotification
        condition: String,
        is_enabled: bool,
    }

    /// Événements
    public struct AgentCreated has copy, drop {
        agent_id: ID,
        event_id: ID,
        agent_type: u8,
        name: String,
    }

    public struct AgentExecuted has copy, drop {
        agent_id: ID,
        execution_count: u64,
        timestamp: u64,
    }

    public struct RuleTriggered has copy, drop {
        agent_id: ID,
        rule_id: u64,
        trigger_type: u8,
        action_type: u8,
    }

    /// Error codes
    const EAgentNotActive: u64 = 1;
    const EInvalidAgentType: u64 = 2;
    const ERuleNotEnabled: u64 = 3;
    const ECooldownNotExpired: u64 = 4;
    const EUnauthorized: u64 = 5;

    /// Types d'agents
    const AGENT_TYPE_CHECKIN: u8 = 1;
    const AGENT_TYPE_REWARDS: u8 = 2;
    const AGENT_TYPE_MISSIONS: u8 = 3;
    const AGENT_TYPE_ANALYTICS: u8 = 4;

    /// Types de triggers
    const TRIGGER_ON_SCAN: u8 = 1;
    const TRIGGER_ON_TIME: u8 = 2;
    const TRIGGER_ON_COMPLETE: u8 = 3;
    const TRIGGER_ON_THRESHOLD: u8 = 4;

    /// Types d'actions
    const ACTION_MINT_ATTESTATION: u8 = 1;
    const ACTION_DISTRIBUTE_REWARD: u8 = 2;
    const ACTION_SEND_NOTIFICATION: u8 = 3;

    /// Créer un nouvel agent IA
    public fun create_agent(
        name: String,
        event_id: ID,
        agent_type: u8,
        auto_approve: bool,
        reward_multiplier: u64,
        min_reward: u64,
        max_reward: u64,
        cooldown_period: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ): AIAgent {
        // Valider le type d'agent
        assert!(
            agent_type >= AGENT_TYPE_CHECKIN && agent_type <= AGENT_TYPE_ANALYTICS,
            EInvalidAgentType
        );

        let agent_uid = object::new(ctx);
        let agent_id = object::uid_to_inner(&agent_uid);
        let timestamp = clock::timestamp_ms(clock);

        let config = AgentConfig {
            auto_approve,
            reward_multiplier,
            min_reward,
            max_reward,
            cooldown_period,
        };

        let agent = AIAgent {
            id: agent_uid,
            name,
            event_id,
            agent_type,
            is_active: true,
            created_at: timestamp,
            execution_count: 0,
            config,
        };

        event::emit(AgentCreated {
            agent_id,
            event_id,
            agent_type,
            name,
        });

        agent
    }

    /// Ajouter une règle d'automatisation à un agent
    public fun add_rule(
        agent: &mut AIAgent,
        rule_id: u64,
        trigger_type: u8,
        action_type: u8,
        condition: String,
    ) {
        let rule = AutomationRule {
            rule_id,
            trigger_type,
            action_type,
            condition,
            is_enabled: true,
        };

        df::add(&mut agent.id, rule_id, rule);
    }

    /// Exécuter un agent (appelé par le backend)
    public entry fun execute_agent(
        agent: &mut AIAgent,
        clock: &Clock,
    ) {
        assert!(agent.is_active, EAgentNotActive);

        let timestamp = clock::timestamp_ms(clock);
        agent.execution_count = agent.execution_count + 1;

        event::emit(AgentExecuted {
            agent_id: object::id(agent),
            execution_count: agent.execution_count,
            timestamp,
        });
    }

    /// Déclencher une règle spécifique
    public entry fun trigger_rule(
        agent: &mut AIAgent,
        rule_id: u64,
    ) {
        assert!(agent.is_active, EAgentNotActive);
        assert!(df::exists_(&agent.id, rule_id), ERuleNotEnabled);

        let rule: &AutomationRule = df::borrow(&agent.id, rule_id);
        assert!(rule.is_enabled, ERuleNotEnabled);

        event::emit(RuleTriggered {
            agent_id: object::id(agent),
            rule_id,
            trigger_type: rule.trigger_type,
            action_type: rule.action_type,
        });
    }

    /// Activer/désactiver un agent
    public fun toggle_agent(agent: &mut AIAgent, is_active: bool) {
        agent.is_active = is_active;
    }

    /// Activer/désactiver une règle
    public fun toggle_rule(agent: &mut AIAgent, rule_id: u64, is_enabled: bool) {
        if (df::exists_(&agent.id, rule_id)) {
            let rule: &mut AutomationRule = df::borrow_mut(&mut agent.id, rule_id);
            rule.is_enabled = is_enabled;
        };
    }

    /// Calculer la récompense avec multiplicateur
    public fun calculate_reward(
        agent: &AIAgent,
        base_reward: u64,
    ): u64 {
        let multiplied = (base_reward * agent.config.reward_multiplier) / 100;
        
        // Appliquer les limites min/max
        if (multiplied < agent.config.min_reward) {
            agent.config.min_reward
        } else if (multiplied > agent.config.max_reward) {
            agent.config.max_reward
        } else {
            multiplied
        }
    }

    /// Getters
    public fun get_agent_id(agent: &AIAgent): ID {
        object::id(agent)
    }

    public fun get_event_id(agent: &AIAgent): ID {
        agent.event_id
    }

    public fun get_agent_type(agent: &AIAgent): u8 {
        agent.agent_type
    }

    public fun is_active(agent: &AIAgent): bool {
        agent.is_active
    }

    public fun get_execution_count(agent: &AIAgent): u64 {
        agent.execution_count
    }

    public fun get_config(agent: &AIAgent): AgentConfig {
        agent.config
    }

    public fun should_auto_approve(agent: &AIAgent): bool {
        agent.config.auto_approve
    }

    /// Vérifier si une règle existe
    public fun has_rule(agent: &AIAgent, rule_id: u64): bool {
        df::exists_(&agent.id, rule_id)
    }

    /// Obtenir une règle
    public fun get_rule(agent: &AIAgent, rule_id: u64): &AutomationRule {
        df::borrow(&agent.id, rule_id)
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        // Pour les tests
    }
}


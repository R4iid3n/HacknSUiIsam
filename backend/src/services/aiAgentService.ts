/**
 * AI Agent Service
 * 
 * Gère les agents IA pour l'automatisation des workflows d'événements
 * Exploite l'architecture objet de Sui pour des agents autonomes
 */

import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

export interface AgentConfig {
  autoApprove: boolean;
  rewardMultiplier: number; // Pourcentage (100 = 1x, 200 = 2x)
  minReward: number;
  maxReward: number;
  cooldownPeriod: number; // En millisecondes
}

export interface AutomationRule {
  ruleId: number;
  triggerType: 'ON_SCAN' | 'ON_TIME' | 'ON_COMPLETE' | 'ON_THRESHOLD';
  actionType: 'MINT_ATTESTATION' | 'DISTRIBUTE_REWARD' | 'SEND_NOTIFICATION';
  condition: string;
  isEnabled: boolean;
}

export interface AIAgent {
  id: string;
  name: string;
  eventId: string;
  agentType: 'CHECK_IN' | 'REWARDS' | 'MISSIONS' | 'ANALYTICS';
  isActive: boolean;
  createdAt: number;
  executionCount: number;
  config: AgentConfig;
  rules: AutomationRule[];
}

// Types d'agents
const AGENT_TYPES = {
  CHECK_IN: 1,
  REWARDS: 2,
  MISSIONS: 3,
  ANALYTICS: 4,
};

// Types de triggers
const TRIGGER_TYPES = {
  ON_SCAN: 1,
  ON_TIME: 2,
  ON_COMPLETE: 3,
  ON_THRESHOLD: 4,
};

// Types d'actions
const ACTION_TYPES = {
  MINT_ATTESTATION: 1,
  DISTRIBUTE_REWARD: 2,
  SEND_NOTIFICATION: 3,
};

export class AIAgentService {
  private suiClient: SuiClient;
  private packageId: string;
  private sponsorKeypair: Ed25519Keypair;
  private agents: Map<string, AIAgent> = new Map();

  constructor(
    suiClient: SuiClient,
    packageId: string,
    sponsorKeypair: Ed25519Keypair
  ) {
    this.suiClient = suiClient;
    this.packageId = packageId;
    this.sponsorKeypair = sponsorKeypair;
  }

  /**
   * Créer un nouvel agent IA
   */
  async createAgent(
    name: string,
    eventId: string,
    agentType: keyof typeof AGENT_TYPES,
    config: AgentConfig
  ): Promise<string> {
    const tx = new Transaction();

    // Créer l'agent IA
    const [agentResult] = tx.moveCall({
      target: `${this.packageId}::ai_agent::create_agent`,
      arguments: [
        tx.pure.string(name),
        tx.pure.id(eventId),
        tx.pure.u8(AGENT_TYPES[agentType]),
        tx.pure.bool(config.autoApprove),
        tx.pure.u64(config.rewardMultiplier),
        tx.pure.u64(config.minReward),
        tx.pure.u64(config.maxReward),
        tx.pure.u64(config.cooldownPeriod),
        tx.object('0x6'), // Clock object
      ],
    });

    // Transférer l'agent au sponsor (qui le gère)
    tx.transferObjects([agentResult], this.sponsorKeypair.getPublicKey().toSuiAddress());

    tx.setGasBudget(100_000_000);

    const result = await this.suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: this.sponsorKeypair,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    // Extraire l'ID de l'agent créé
    const createdObjects = result.objectChanges?.filter(
      (change) => change.type === 'created'
    );

    if (!createdObjects || createdObjects.length === 0) {
      throw new Error('Failed to create AI agent');
    }

    const agentId = (createdObjects[0] as any).objectId;

    // Stocker en mémoire
    const agent: AIAgent = {
      id: agentId,
      name,
      eventId,
      agentType,
      isActive: true,
      createdAt: Date.now(),
      executionCount: 0,
      config,
      rules: [],
    };

    this.agents.set(agentId, agent);

    console.log(`✅ Agent IA créé: ${name} (${agentType}) - ID: ${agentId}`);

    return agentId;
  }

  /**
   * Ajouter une règle d'automatisation
   */
  async addRule(
    agentId: string,
    rule: Omit<AutomationRule, 'isEnabled'>
  ): Promise<void> {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::ai_agent::add_rule`,
      arguments: [
        tx.object(agentId),
        tx.pure.u64(rule.ruleId),
        tx.pure.u8(TRIGGER_TYPES[rule.triggerType]),
        tx.pure.u8(ACTION_TYPES[rule.actionType]),
        tx.pure.string(rule.condition),
      ],
    });

    tx.setGasBudget(100_000_000);

    await this.suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: this.sponsorKeypair,
    });

    // Mettre à jour en mémoire
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.rules.push({ ...rule, isEnabled: true });
    }

    console.log(`✅ Règle ajoutée à l'agent ${agentId}: ${rule.triggerType} → ${rule.actionType}`);
  }

  /**
   * Exécuter un agent
   */
  async executeAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent || !agent.isActive) {
      throw new Error('Agent not found or not active');
    }

    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::ai_agent::execute_agent`,
      arguments: [
        tx.object(agentId),
        tx.object('0x6'), // Clock object
      ],
    });

    tx.setGasBudget(100_000_000);

    await this.suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: this.sponsorKeypair,
    });

    // Incrémenter le compteur
    agent.executionCount++;

    console.log(`✅ Agent exécuté: ${agent.name} (${agent.executionCount} exécutions)`);
  }

  /**
   * Déclencher une règle spécifique
   */
  async triggerRule(agentId: string, ruleId: number): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent || !agent.isActive) {
      throw new Error('Agent not found or not active');
    }

    const rule = agent.rules.find((r) => r.ruleId === ruleId);
    if (!rule || !rule.isEnabled) {
      throw new Error('Rule not found or not enabled');
    }

    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::ai_agent::trigger_rule`,
      arguments: [
        tx.object(agentId),
        tx.pure.u64(ruleId),
      ],
    });

    tx.setGasBudget(100_000_000);

    await this.suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: this.sponsorKeypair,
    });

    console.log(`✅ Règle déclenchée: Agent ${agent.name}, Règle #${ruleId}`);
  }

  /**
   * Calculer la récompense avec multiplicateur
   */
  calculateReward(agentId: string, baseReward: number): number {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return baseReward;
    }

    const multiplied = Math.floor((baseReward * agent.config.rewardMultiplier) / 100);

    // Appliquer les limites
    if (multiplied < agent.config.minReward) {
      return agent.config.minReward;
    } else if (multiplied > agent.config.maxReward) {
      return agent.config.maxReward;
    }

    return multiplied;
  }

  /**
   * Activer/désactiver un agent
   */
  async toggleAgent(agentId: string, isActive: boolean): Promise<void> {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::ai_agent::toggle_agent`,
      arguments: [
        tx.object(agentId),
        tx.pure.bool(isActive),
      ],
    });

    tx.setGasBudget(100_000_000);

    await this.suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: this.sponsorKeypair,
    });

    const agent = this.agents.get(agentId);
    if (agent) {
      agent.isActive = isActive;
    }

    console.log(`✅ Agent ${isActive ? 'activé' : 'désactivé'}: ${agentId}`);
  }

  /**
   * Obtenir un agent
   */
  getAgent(agentId: string): AIAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Obtenir tous les agents d'un événement
   */
  getEventAgents(eventId: string): AIAgent[] {
    return Array.from(this.agents.values()).filter(
      (agent) => agent.eventId === eventId
    );
  }

  /**
   * Obtenir tous les agents
   */
  getAllAgents(): AIAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Workflow automatique: Check-in → Attestation → Récompense
   */
  async autoCheckInWorkflow(
    agentId: string,
    userId: string,
    missionId: number
  ): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent || !agent.isActive || agent.agentType !== 'CHECK_IN') {
      throw new Error('Invalid check-in agent');
    }

    console.log(`🤖 Agent IA: Workflow check-in automatique pour ${userId}`);

    // 1. Vérifier si auto-approve est activé
    if (agent.config.autoApprove) {
      console.log('   ✓ Auto-approve activé, validation automatique');
    }

    // 2. Déclencher les règles ON_SCAN
    const scanRules = agent.rules.filter(
      (r) => r.triggerType === 'ON_SCAN' && r.isEnabled
    );

    for (const rule of scanRules) {
      await this.triggerRule(agentId, rule.ruleId);
      
      if (rule.actionType === 'MINT_ATTESTATION') {
        console.log('   ✓ Attestation mintée automatiquement');
      } else if (rule.actionType === 'DISTRIBUTE_REWARD') {
        console.log('   ✓ Récompense distribuée automatiquement');
      }
    }

    // 3. Exécuter l'agent
    await this.executeAgent(agentId);

    console.log(`✅ Workflow check-in terminé pour ${userId}`);
  }
}

export class MockAIAgentService extends AIAgentService {
  constructor() {
    // Mock - pas de vraie connexion
    super(null as any, 'mock-package', null as any);
  }

  async createAgent(
    name: string,
    eventId: string,
    agentType: keyof typeof AGENT_TYPES,
    config: AgentConfig
  ): Promise<string> {
    const agentId = `mock-agent-${Date.now()}`;
    
    const agent: AIAgent = {
      id: agentId,
      name,
      eventId,
      agentType,
      isActive: true,
      createdAt: Date.now(),
      executionCount: 0,
      config,
      rules: [],
    };

    this.agents.set(agentId, agent);

    console.log(`🔶 [MOCK] Agent IA créé: ${name} (${agentType})`);

    return agentId;
  }

  async addRule(agentId: string, rule: Omit<AutomationRule, 'isEnabled'>): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.rules.push({ ...rule, isEnabled: true });
    }
    console.log(`🔶 [MOCK] Règle ajoutée: ${rule.triggerType} → ${rule.actionType}`);
  }

  async executeAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.executionCount++;
    }
    console.log(`🔶 [MOCK] Agent exécuté: ${agentId}`);
  }

  async triggerRule(agentId: string, ruleId: number): Promise<void> {
    console.log(`🔶 [MOCK] Règle déclenchée: Agent ${agentId}, Règle #${ruleId}`);
  }

  async toggleAgent(agentId: string, isActive: boolean): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.isActive = isActive;
    }
    console.log(`🔶 [MOCK] Agent ${isActive ? 'activé' : 'désactivé'}: ${agentId}`);
  }
}


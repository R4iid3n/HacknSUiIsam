/**
 * AI Agents Routes
 * 
 * Routes pour gérer les agents IA d'automatisation
 */

import { FastifyInstance } from 'fastify';
import { AIAgentService, MockAIAgentService } from '../services/aiAgentService.js';

export async function aiAgentRoutes(
  fastify: FastifyInstance,
  config: any,
  aiAgentService: AIAgentService | MockAIAgentService
) {
  // Créer un agent IA
  fastify.post('/api/admin/agents', async (request, reply) => {
    const { name, eventId, agentType, config } = request.body as any;

    if (!name || !eventId || !agentType || !config) {
      return reply.code(400).send({ error: 'Missing required fields' });
    }

    try {
      const agentId = await aiAgentService.createAgent(
        name,
        eventId,
        agentType,
        config
      );

      return {
        success: true,
        agentId,
        message: 'Agent IA créé avec succès',
      };
    } catch (error: any) {
      fastify.log.error('Failed to create AI agent:', error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // Ajouter une règle à un agent
  fastify.post('/api/admin/agents/:agentId/rules', async (request, reply) => {
    const { agentId } = request.params as any;
    const rule = request.body as any;

    if (!rule.ruleId || !rule.triggerType || !rule.actionType) {
      return reply.code(400).send({ error: 'Missing required fields' });
    }

    try {
      await aiAgentService.addRule(agentId, rule);

      return {
        success: true,
        message: 'Règle ajoutée avec succès',
      };
    } catch (error: any) {
      fastify.log.error('Failed to add rule:', error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // Obtenir un agent
  fastify.get('/api/agents/:agentId', async (request, reply) => {
    const { agentId } = request.params as any;

    const agent = aiAgentService.getAgent(agentId);

    if (!agent) {
      return reply.code(404).send({ error: 'Agent not found' });
    }

    return agent;
  });

  // Obtenir tous les agents d'un événement
  fastify.get('/api/events/:eventId/agents', async (request, reply) => {
    const { eventId } = request.params as any;

    const agents = aiAgentService.getEventAgents(eventId);

    return {
      agents,
      count: agents.length,
    };
  });

  // Obtenir tous les agents
  fastify.get('/api/admin/agents', async (request, reply) => {
    const agents = aiAgentService.getAllAgents();

    return {
      agents,
      count: agents.length,
    };
  });

  // Activer/désactiver un agent
  fastify.patch('/api/admin/agents/:agentId/toggle', async (request, reply) => {
    const { agentId } = request.params as any;
    const { isActive } = request.body as any;

    if (typeof isActive !== 'boolean') {
      return reply.code(400).send({ error: 'isActive must be a boolean' });
    }

    try {
      await aiAgentService.toggleAgent(agentId, isActive);

      return {
        success: true,
        message: `Agent ${isActive ? 'activé' : 'désactivé'}`,
      };
    } catch (error: any) {
      fastify.log.error('Failed to toggle agent:', error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // Exécuter un agent manuellement
  fastify.post('/api/admin/agents/:agentId/execute', async (request, reply) => {
    const { agentId } = request.params as any;

    try {
      await aiAgentService.executeAgent(agentId);

      return {
        success: true,
        message: 'Agent exécuté avec succès',
      };
    } catch (error: any) {
      fastify.log.error('Failed to execute agent:', error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // Déclencher une règle
  fastify.post('/api/admin/agents/:agentId/rules/:ruleId/trigger', async (request, reply) => {
    const { agentId, ruleId } = request.params as any;

    try {
      await aiAgentService.triggerRule(agentId, parseInt(ruleId));

      return {
        success: true,
        message: 'Règle déclenchée avec succès',
      };
    } catch (error: any) {
      fastify.log.error('Failed to trigger rule:', error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // Workflow automatique check-in
  fastify.post('/api/agents/:agentId/auto-checkin', async (request, reply) => {
    const { agentId } = request.params as any;
    const { userId, missionId } = request.body as any;

    if (!userId || !missionId) {
      return reply.code(400).send({ error: 'Missing userId or missionId' });
    }

    try {
      await aiAgentService.autoCheckInWorkflow(agentId, userId, missionId);

      return {
        success: true,
        message: 'Workflow check-in automatique terminé',
      };
    } catch (error: any) {
      fastify.log.error('Failed to execute auto check-in:', error);
      return reply.code(500).send({ error: error.message });
    }
  });

  console.log('✅ Routes AI Agents enregistrées');
}


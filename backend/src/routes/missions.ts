import type { FastifyInstance } from 'fastify';
import { Transaction } from '@mysten/sui/transactions';
import { getSession } from './auth.js';
import { generateMissionQR, verifyQRToken } from '../services/qrService.js';
import { getSuiClient, getDynamicFields, getDynamicFieldObject } from '../services/suiClient.js';
import type { AppConfig } from '../config.js';
import type { SponsoredTransactionService } from '../services/sponsoredTx.js';

export async function missionRoutes(
  fastify: FastifyInstance,
  config: AppConfig,
  sponsorTxService: SponsoredTransactionService
) {
  /**
   * GET /api/missions?eventId=<id>
   * Get all missions for an event
   */
  fastify.get<{ Querystring: { eventId: string } }>('/api/missions', async (request, reply) => {
    try {
      const { eventId } = request.query;

      if (!eventId) {
        return reply.code(400).send({ error: 'eventId required' });
      }

      if (config.mockMode) {
        // Mock missions for development
        return {
          missions: [
            {
              missionId: 0,
              title: 'Check-in at Hackathon',
              description: 'Scan QR code at the entrance to check-in',
              rewardAmount: 100000000, // 0.1 SUI
              active: true,
              completions: 5,
            },
            {
              missionId: 1,
              title: 'Attend Workshop',
              description: 'Participate in the Move smart contracts workshop',
              rewardAmount: 200000000, // 0.2 SUI
              active: true,
              completions: 3,
            },
            {
              missionId: 2,
              title: 'Submit Project',
              description: 'Submit your hackathon project on DevFolio',
              rewardAmount: 500000000, // 0.5 SUI
              active: true,
              completions: 1,
            },
          ],
        };
      }

      // Fetch missions from blockchain
      const suiClient = getSuiClient();

      // Get Event object
      const eventObj = await suiClient.getObject({
        id: eventId,
        options: { showContent: true },
      });

      if (!eventObj.data) {
        return reply.code(404).send({ error: 'Event not found' });
      }

      // Get dynamic fields (missions)
      const dynamicFields = await getDynamicFields(eventId);

      const missions = await Promise.all(
        dynamicFields.data.map(async (field: any) => {
          const missionData = await getDynamicFieldObject(eventId, field.name);
          const content = missionData.data?.content as any;

          // Mission data is nested in fields.value.fields for dynamic fields
          const missionFields = content.fields.value.fields;

          return {
            missionId: parseInt(missionFields.mission_id, 10),
            title: missionFields.title,
            description: missionFields.description,
            rewardAmount: parseInt(missionFields.reward_amount, 10),
            active: missionFields.active,
            completions: parseInt(missionFields.completions, 10),
          };
        })
      );

      return { missions };
    } catch (error: any) {
      console.error('Failed to fetch missions:', error);
      return reply.code(500).send({
        error: error.message || 'Failed to fetch missions',
      });
    }
  });

  /**
   * GET /api/missions/:missionId/qr?eventId=<id>
   * Generate QR code for a mission
   */
  fastify.get<{
    Params: { missionId: string };
    Querystring: { eventId: string };
  }>('/api/missions/:missionId/qr', async (request, reply) => {
    try {
      const { missionId } = request.params;
      const { eventId } = request.query;

      if (!eventId) {
        return reply.code(400).send({ error: 'eventId required' });
      }

      // Generate signed QR code
      const qrData = await generateMissionQR(eventId, parseInt(missionId, 10), config);

      return {
        token: qrData.token,
        qrDataUrl: qrData.qrDataUrl,
        payload: qrData.payload,
      };
    } catch (error: any) {
      console.error('Failed to generate QR:', error);
      return reply.code(500).send({
        error: error.message || 'Failed to generate QR code',
      });
    }
  });

  /**
   * POST /api/scan
   * Scan and verify a QR code
   */
  fastify.post<{
    Body: { qrToken: string };
  }>('/api/scan', async (request, reply) => {
    try {
      const session = getSession(request);
      if (!session) {
        return reply.code(401).send({ error: 'Not authenticated' });
      }

      const { qrToken } = request.body;

      if (!qrToken) {
        return reply.code(400).send({ error: 'qrToken required' });
      }

      // Verify QR token
      const verification = verifyQRToken(qrToken, config);

      if (!verification.valid) {
        return reply.code(400).send({
          error: verification.error || 'Invalid QR code',
        });
      }

      return {
        valid: true,
        payload: verification.payload,
      };
    } catch (error: any) {
      console.error('QR scan error:', error);
      return reply.code(500).send({
        error: error.message || 'QR scan failed',
      });
    }
  });
}

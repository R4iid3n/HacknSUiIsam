import type { FastifyInstance } from 'fastify';
import { Transaction } from '@mysten/sui/transactions';
import { getSession } from './auth.js';
import { verifyQRToken } from '../services/qrService.js';
import { getSuiClient } from '../services/suiClient.js';
import type { AppConfig } from '../config.js';
import type { SponsoredTransactionService } from '../services/sponsoredTx.js';

export async function passportRoutes(
  fastify: FastifyInstance,
  config: AppConfig,
  sponsorTxService: SponsoredTransactionService
) {
  /**
   * GET /api/passport
   * Get user's passport and attestations
   */
  fastify.get('/api/passport', async (request, reply) => {
    try {
      const session = getSession(request);
      if (!session) {
        return reply.code(401).send({ error: 'Not authenticated' });
      }

      if (config.mockMode) {
        // Mock passport data
        return {
          hasPassport: true,
          passportId: '0xMOCKPASSPORT123456',
          attestations: [
            {
              eventId: '0xMOCKEVENT',
              eventName: 'SUI Hackathon 2025',
              missionId: 0,
              missionTitle: 'Check-in',
              completedAt: Date.now() - 3600000,
              rewardAmount: 100000000,
            },
          ],
          totalRewards: 100000000,
        };
      }

      // Query blockchain for user's passport
      const suiClient = getSuiClient();

      // Get all objects owned by user
      const objects = await suiClient.getOwnedObjects({
        owner: session.address,
        filter: {
          StructType: `${config.packageId}::passport::Passport`,
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (objects.data.length === 0) {
        return {
          hasPassport: false,
          passportId: null,
          attestations: [],
          totalRewards: 0,
        };
      }

      // Get first passport (users should only have one)
      const passportObj = objects.data[0];
      const passportId = passportObj.data?.objectId;
      const content = passportObj.data?.content as any;

      // Get attestations from dynamic fields
      const attestations: any[] = [];
      let totalRewards = 0;

      // TODO: Fetch dynamic fields for attestations
      // For now return basic passport info

      return {
        hasPassport: true,
        passportId,
        attestations,
        totalRewards,
      };
    } catch (error: any) {
      console.error('Failed to fetch passport:', error);
      return reply.code(500).send({
        error: error.message || 'Failed to fetch passport',
      });
    }
  });

  /**
   * POST /api/passport/register
   * Register a new passport (gasless)
   */
  fastify.post('/api/passport/register', async (request, reply) => {
    try {
      const session = getSession(request);
      if (!session) {
        return reply.code(401).send({ error: 'Not authenticated' });
      }

      if (config.mockMode) {
        // Mock response
        return {
          success: true,
          passportId: '0xMOCKPASSPORT' + Math.random().toString(36).substring(2),
          digest: '0xMOCKDIGEST' + Math.random().toString(36).substring(2),
        };
      }

      // Create transaction to register passport
      const tx = new Transaction();

      // Call passport::register_passport with user address
      tx.moveCall({
        target: `${config.packageId}::passport::register_passport`,
        arguments: [
          tx.pure.address(session.address), // user_address
          tx.pure.u64(Date.now()),          // clock_timestamp
        ],
      });

      // Execute as sponsored transaction
      const result = await sponsorTxService.executeFullySponsoredTransaction(tx);

      // Find created passport object
      const passportObj = result.objectChanges?.find(
        (change: any) =>
          change.type === 'created' && change.objectType.includes('::passport::Passport')
      );

      return {
        success: true,
        passportId: passportObj?.objectId || null,
        digest: result.digest,
      };
    } catch (error: any) {
      console.error('Passport registration failed:', error);
      return reply.code(500).send({
        error: error.message || 'Passport registration failed',
      });
    }
  });

  /**
   * POST /api/claim
   * Claim a mission reward (gasless)
   */
  fastify.post<{
    Body: {
      eventId: string;
      missionId: number;
      qrToken: string;
      autoRegisterPassport?: boolean;
    };
  }>('/api/claim', async (request, reply) => {
    try {
      const session = getSession(request);
      if (!session) {
        return reply.code(401).send({ error: 'Not authenticated' });
      }

      const { eventId, missionId, qrToken, autoRegisterPassport } = request.body;

      if (!eventId || missionId === undefined || !qrToken) {
        return reply.code(400).send({
          error: 'Missing required fields: eventId, missionId, qrToken',
        });
      }

      // Verify QR token
      const verification = verifyQRToken(qrToken, config);
      if (!verification.valid) {
        return reply.code(400).send({
          error: verification.error || 'Invalid QR code',
        });
      }

      // Check QR matches mission
      if (
        verification.payload?.eventId !== eventId ||
        verification.payload?.missionId !== missionId
      ) {
        return reply.code(400).send({
          error: 'QR code does not match mission',
        });
      }

      if (config.mockMode) {
        // Mock response
        return {
          success: true,
          mock: true,
          digest: '0xMOCKCLAIM' + Math.random().toString(36).substring(2),
          reward: 100000000,
        };
      }

      // Get user's passport
      const suiClient = getSuiClient();
      const objects = await suiClient.getOwnedObjects({
        owner: session.address,
        filter: {
          StructType: `${config.packageId}::passport::Passport`,
        },
      });

      let passportId: string | null = null;

      if (objects.data.length === 0 && autoRegisterPassport) {
        // Auto-register passport
        const tx = new Transaction();
        tx.moveCall({
          target: `${config.packageId}::passport::register_passport`,
          arguments: [
            tx.pure.address(session.address), // user_address
            tx.pure.u64(Date.now()),          // clock_timestamp
          ],
        });

        const registerResult = await sponsorTxService.executeFullySponsoredTransaction(tx);
        const passportObj = registerResult.objectChanges?.find(
          (change: any) =>
            change.type === 'created' && change.objectType.includes('::passport::Passport')
        );
        passportId = passportObj?.objectId || null;
      } else if (objects.data.length > 0) {
        passportId = objects.data[0].data?.objectId || null;
      }

      if (!passportId) {
        return reply.code(400).send({
          error: 'No passport found. Register a passport first.',
        });
      }

      // Create transaction to claim mission
      const tx = new Transaction();

      // Get Clock object (0x6)
      const clockId = '0x6';

      // Call mission::complete_mission_and_reward
      tx.moveCall({
        target: `${config.packageId}::mission::complete_mission_and_reward`,
        arguments: [
          tx.object(eventId), // event
          tx.object(passportId), // passport
          tx.pure.address(session.address), // user_address
          tx.pure.u64(missionId), // mission_id
          tx.pure.vector('u8', Array.from(Buffer.from(qrToken))), // qr_proof
          tx.object(clockId), // clock
        ],
      });

      // Execute sponsored transaction
      const result = await sponsorTxService.executeFullySponsoredTransaction(tx);

      return {
        success: true,
        digest: result.digest,
        passportId,
      };
    } catch (error: any) {
      console.error('Claim failed:', error);
      return reply.code(500).send({
        error: error.message || 'Claim failed',
      });
    }
  });
}

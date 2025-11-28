import type { FastifyInstance } from 'fastify';
import { Transaction } from '@mysten/sui/transactions';
import { getSession } from './auth.js';
import { verifyQRToken } from '../services/qrService.js';
import { getSuiClient, getDynamicFields, getDynamicFieldObject } from '../services/suiClient.js';
import type { AppConfig } from '../config.js';
import type { SponsoredTransactionService, MockSponsoredTransactionService } from '../services/sponsoredTx.js';
import type { BackendWalrusService } from '../services/walrusService.js';
import { validateEventId, validateMissionId, handleValidationError } from '../middleware/validation.js';

export async function passportRoutes(
  fastify: FastifyInstance,
  config: AppConfig,
  sponsorTxService: SponsoredTransactionService | MockSponsoredTransactionService,
  walrusService?: BackendWalrusService
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
      if (!passportId) {
        return {
          hasPassport: false,
          passportId: null,
          attestations: [],
          totalRewards: 0,
          attestationCount: 0,
        };
      }

      // Extract passport data
      const passportContent = passportObj.data?.content as {
        fields?: {
          owner?: string;
          created_at?: string;
          attestation_count?: string;
        };
      };

      const owner = passportContent?.fields?.owner || session.address;
      const createdAt = parseInt(passportContent?.fields?.created_at || '0', 10);
      const attestationCount = parseInt(passportContent?.fields?.attestation_count || '0', 10);

      // Get attestations from dynamic fields
      const attestations: Array<{
        eventId: string;
        eventName: string;
        missionId: number;
        missionTitle: string;
        completedAt: number;
        rewardAmount: number;
      }> = [];
      let totalRewards = 0;

      // Fetch dynamic fields for attestations
      if (passportId) {
        try {
          const dynamicFields = await getDynamicFields(passportId, 100);
          
          // Fetch each attestation object
          for (const field of dynamicFields.data) {
            try {
              const attestationObj = await getDynamicFieldObject(passportId, field.name);
              const attestationContent = attestationObj.data?.content as {
                fields?: {
                  event_id?: { fields?: { id?: string } };
                  event_name?: string;
                  mission_id?: string;
                  mission_title?: string;
                  completed_at?: string;
                  reward_amount?: string;
                };
              };

              if (attestationContent?.fields) {
                const fields = attestationContent.fields;
                const eventId = fields.event_id?.fields?.id || '';
                const eventName = fields.event_name || 'Unknown Event';
                const missionId = parseInt(fields.mission_id || '0', 10);
                const missionTitle = fields.mission_title || 'Unknown Mission';
                const completedAt = parseInt(fields.completed_at || '0', 10);
                const rewardAmount = parseInt(fields.reward_amount || '0', 10);

                attestations.push({
                  eventId,
                  eventName,
                  missionId,
                  missionTitle,
                  completedAt,
                  rewardAmount,
                });

                totalRewards += rewardAmount;
              }
            } catch (err) {
              console.warn(`Failed to fetch attestation ${field.name}:`, err);
              // Continue with other attestations
            }
          }
        } catch (err) {
          console.warn('Failed to fetch dynamic fields:', err);
          // Return passport without attestations if dynamic fields fail
        }
      }

      return {
        hasPassport: true,
        passportId,
        owner,
        createdAt,
        attestations,
        totalRewards,
        attestationCount,
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
   * Register a new passport (fully sponsored - gasless)
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

      // First, send some SUI to the user for gas (0.1 SUI)
      const [coin] = tx.splitCoins(tx.gas, [100_000_000]); // 0.1 SUI
      tx.transferObjects([coin], session.address);

      // Call passport::register_passport with user address and clock
      tx.moveCall({
        target: `${config.packageId}::passport::register_passport`,
        arguments: [
          tx.pure.address(session.address), // user_address
          tx.object('0x6'),                  // Clock object
        ],
      });

      // Execute as sponsored transaction
      const result = await sponsorTxService.executeFullySponsoredTransaction(tx);

      // Debug: log all object changes
      console.log('Object changes:', JSON.stringify(result.objectChanges, null, 2));

      // Find created passport object (it will be both created and transferred)
      const passportObj = result.objectChanges?.find(
        (change: any) =>
          (change.type === 'created' || change.type === 'transferred') &&
          change.objectType?.includes('::passport::Passport')
      );

      console.log('✅ Passport registered + 0.1 SUI sent to user for gas');

      return {
        success: true,
        passportId: passportObj?.objectId || null,
        digest: result.digest,
        gasFunded: true, // User received initial gas
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
      qrToken: string;
      autoRegisterPassport?: boolean;
    };
  }>('/api/claim', async (request, reply) => {
    try {
      const session = getSession(request);
      if (!session) {
        return reply.code(401).send({ error: 'Not authenticated' });
      }

      const { eventId, qrToken, autoRegisterPassport } = request.body;

      // ===== DEBUG LOGGING =====
      console.log('🎯 [CLAIM ENDPOINT] Received claim request');
      console.log('🎯 Request Body:', {
        eventId,
        hasQRToken: !!qrToken,
        qrTokenLength: qrToken?.length,
        autoRegisterPassport,
      });
      console.log('🎯 Session:', {
        address: session.address,
        authenticated: !!session,
      });
      console.log('🎯 Config Package ID:', config.packageId);
      // ===== END DEBUG =====

      // Input validation
      try {
        if (!eventId || !validateEventId(eventId)) {
          return reply.code(400).send({
            error: 'Invalid eventId format',
          });
        }

        if (!qrToken || typeof qrToken !== 'string' || qrToken.trim().length === 0) {
          return reply.code(400).send({
            error: 'Invalid qrToken (must be a non-empty string)',
          });
        }
      } catch (error) {
        return handleValidationError(error, reply);
      }

      // Verify QR token
      const verification = verifyQRToken(qrToken, config);
      if (!verification.valid) {
        return reply.code(400).send({
          error: verification.error || 'Invalid QR code',
        });
      }

      // Extract missionId from QR token payload
      const missionId = verification.payload?.missionId;
      if (missionId === undefined || !validateMissionId(missionId)) {
        return reply.code(400).send({
          error: 'Invalid missionId in QR token',
        });
      }

      // Check QR matches event
      if (verification.payload?.eventId !== eventId) {
        return reply.code(400).send({
          error: 'QR code does not match event',
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
            tx.object('0x6'),                  // Clock object
          ],
        });

        const registerResult = await sponsorTxService.executeFullySponsoredTransaction(tx);
        const passportObj = registerResult.objectChanges?.find(
          (change: any) =>
            (change.type === 'created' || change.type === 'transferred') &&
            change.objectType?.includes('::passport::Passport')
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

      // DEBUG: Check event object details
      console.log('🔍 DEBUG: Fetching event object details...');
      const eventObj = await getSuiClient().getObject({
        id: eventId,
        options: {
          showType: true,
          showOwner: true,
          showContent: true,
        },
      });

      console.log('🔍 Event Object Type:', eventObj.data?.type);
      console.log('🔍 Event Object Owner:', JSON.stringify(eventObj.data?.owner));
      console.log('🔍 Package ID from config:', config.packageId);

      // Verify the event type matches what we expect
      const expectedEventType = `${config.packageId}::event::Event`;
      if (eventObj.data?.type !== expectedEventType) {
        console.error('❌ TYPE MISMATCH!');
        console.error('Expected:', expectedEventType);
        console.error('Got:', eventObj.data?.type);
        throw new Error(`Event type mismatch. Expected ${expectedEventType} but got ${eventObj.data?.type}`);
      }

      console.log('✅ Event type matches');

      // Call mission::complete_mission_and_reward
      // Use tx.object() which automatically handles shared vs owned objects
      tx.moveCall({
        target: `${config.packageId}::mission::complete_mission_and_reward`,
        arguments: [
          tx.object(eventId), // event (shared object)
          tx.object(passportId), // passport (owned by user)
          tx.pure.address(session.address), // user_address
          tx.pure.u64(missionId), // mission_id
          tx.pure.vector('u8', Array.from(Buffer.from(qrToken))), // qr_proof
          tx.object(clockId), // clock (shared object 0x6)
        ],
      });

      console.log('🔍 Transaction built with target:', `${config.packageId}::mission::complete_mission_and_reward`);

      // Set user as sender (required because they own the passport)
      tx.setSender(session.address);

      // Set gas budget
      tx.setGasBudget(100_000_000); // 0.1 SUI max

      // Build transaction - user will pay gas from their own coins
      const txBytes = await tx.build({
        client: getSuiClient(),
      });

      // Return transaction bytes for frontend to sign
      const sponsorAddress = sponsorTxService.getSponsorAddress();

      return {
        success: true,
        needsSignature: true,
        txBytes: Buffer.from(txBytes).toString('base64'),
        passportId,
        sponsorAddress,
      };
    } catch (error: any) {
      console.error('Claim failed:', error);
      return reply.code(500).send({
        error: error.message || 'Claim failed',
      });
    }
  });

  /**
   * POST /api/claim/execute
   * Execute signed claim transaction with gas sponsorship
   */
  fastify.post<{
    Body: { signedTxBytes: string; signature: string };
  }>('/api/claim/execute', async (request, reply) => {
    try {
      const { signedTxBytes, signature } = request.body;

      if (!signedTxBytes || !signature) {
        return reply.code(400).send({
          error: 'Missing signedTxBytes or signature',
        });
      }

      console.log('📝 Execute claim - User signature received');
      console.log('📝 Signature length:', signature.length);
      console.log('📝 Transaction bytes length:', signedTxBytes.length);

      // Decode transaction bytes
      const txBytes = Buffer.from(signedTxBytes, 'base64');
      console.log('📝 Decoded bytes length:', txBytes.length);

      // Execute transaction with only user signature
      // User pays their own gas for now (they receive rewards > gas cost)
      console.log('📝 Executing transaction...');
      const result = await getSuiClient().executeTransactionBlock({
        transactionBlock: txBytes,
        signature: signature,
        options: {
          showEffects: true,
          showObjectChanges: true,
          showEvents: true,
        },
      });

      console.log('📝 Transaction result status:', result.effects?.status?.status);
      console.log('📝 Transaction effects:', JSON.stringify(result.effects, null, 2));

      if (result.effects?.status?.status !== 'success') {
        console.error('❌ Transaction failed with status:', result.effects?.status);
        throw new Error(
          `Transaction failed: ${result.effects?.status?.error || 'Unknown error'}`
        );
      }

      console.log('✅ Transaction executed successfully!');

      return {
        success: true,
        digest: result.digest,
        effects: result.effects,
      };
    } catch (error: any) {
      console.error('Execute claim failed:', error);
      return reply.code(500).send({
        error: error.message || 'Execute claim failed',
      });
    }
  });
}

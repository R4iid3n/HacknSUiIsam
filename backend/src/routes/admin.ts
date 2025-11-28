import type { FastifyInstance } from 'fastify';
import { Transaction } from '@mysten/sui/transactions';
import { getSession } from './auth.js';
import type { AppConfig } from '../config.js';
import type { SponsoredTransactionService, MockSponsoredTransactionService } from '../services/sponsoredTx.js';
import type { BackendWalrusService } from '../services/walrusService.js';
import type { SuiNSService } from '../services/suinsService.js';
import { validateNonEmptyString, validatePositiveNumber, validateTimestamp, handleValidationError } from '../middleware/validation.js';
import { registerEventId } from './events.js';

export async function adminRoutes(
  fastify: FastifyInstance,
  config: AppConfig,
  sponsorTxService: SponsoredTransactionService | MockSponsoredTransactionService,
  walrusService?: BackendWalrusService,
  suinsService?: SuiNSService
) {
  /**
   * POST /api/admin/init
   * Initialize a new event with grant pool
   */
  fastify.post<{
    Body: {
      name: string;
      description: string;
      startTime: number;
      endTime: number;
      initialFunding: number; // in MIST (1 SUI = 1_000_000_000 MIST)
    };
  }>('/api/admin/init', async (request, reply) => {
    try {
      const session = getSession(request);
      if (!session) {
        return reply.code(401).send({ error: 'Not authenticated' });
      }

      const { name, description, startTime, endTime, initialFunding } = request.body;

      // Input validation
      try {
        validateNonEmptyString(name, 'name');
        validateNonEmptyString(description, 'description');
        
        if (startTime === undefined || !validateTimestamp(startTime)) {
          return reply.code(400).send({
            error: 'Invalid startTime (must be a valid timestamp)',
          });
        }

        if (endTime === undefined || !validateTimestamp(endTime)) {
          return reply.code(400).send({
            error: 'Invalid endTime (must be a valid timestamp)',
          });
        }

        if (startTime >= endTime) {
        return reply.code(400).send({
            error: 'startTime must be before endTime',
          });
        }

        if (initialFunding !== undefined) {
          validatePositiveNumber(initialFunding, 'initialFunding');
        }
      } catch (error) {
        return handleValidationError(error, reply);
      }

      if (config.mockMode) {
        return {
          success: true,
          mock: true,
          eventId: '0xMOCKEVENT' + Math.random().toString(36).substring(2),
          adminCapId: '0xMOCKADMINCap' + Math.random().toString(36).substring(2),
        };
      }

      // Create transaction to initialize event
      const tx = new Transaction();

      // Call event::create_event
      tx.moveCall({
        target: `${config.packageId}::event::create_event`,
        arguments: [
          tx.pure.vector('u8', Array.from(Buffer.from(name))),
          tx.pure.vector('u8', Array.from(Buffer.from(description))),
          tx.pure.u64(startTime || Date.now()),
          tx.pure.u64(endTime || Date.now() + 86400000), // +24h default
        ],
      });

      // Execute sponsored transaction
      const result = await sponsorTxService.executeFullySponsoredTransaction(tx);

      // Extract created objects
      const eventObj = result.objectChanges?.find(
        (change: any) => change.type === 'created' && change.objectType.includes('::event::Event')
      );

      const adminCapObj = result.objectChanges?.find(
        (change: any) =>
          change.type === 'created' && change.objectType.includes('::event::EventAdminCap')
      );

      const eventId = eventObj?.objectId;
      const adminCapId = adminCapObj?.objectId;

      // Register the event ID so it appears in the events list
      if (eventId) {
        registerEventId(eventId);
      }

      return {
        success: true,
        eventId,
        adminCapId,
        digest: result.digest,
      };
    } catch (error: any) {
      console.error('Event initialization failed:', error);
      return reply.code(500).send({
        error: error.message || 'Event initialization failed',
      });
    }
  });

  /**
   * POST /api/admin/missions
   * Create a new mission for an event
   */
  fastify.post<{
    Body: {
      eventId: string;
      adminCapId: string;
      title: string;
      description: string;
      rewardAmount: number; // in MIST
      qrSecret?: string;
    };
  }>('/api/admin/missions', async (request, reply) => {
    try {
      const session = getSession(request);
      if (!session) {
        return reply.code(401).send({ error: 'Not authenticated' });
      }

      const { eventId, adminCapId, title, description, rewardAmount, qrSecret } = request.body;

      console.log('📝 Creating mission with params:', {
        eventId,
        adminCapId,
        title,
        description,
        rewardAmount,
        packageId: config.packageId,
      });

      if (!eventId || !adminCapId || !title || !description || !rewardAmount) {
        return reply.code(400).send({
          error: 'Missing required fields: eventId, adminCapId, title, description, rewardAmount',
        });
      }

      // Validate Event ID format
      if (!eventId.startsWith('0x') || eventId.length < 10) {
        return reply.code(400).send({
          error: 'Invalid Event ID format. Must start with 0x',
        });
      }

      // Validate Admin Cap ID format
      if (!adminCapId.startsWith('0x') || adminCapId.length < 10) {
        return reply.code(400).send({
          error: 'Invalid Admin Cap ID format. Must start with 0x',
        });
      }

      if (config.mockMode) {
        return {
          success: true,
          mock: true,
          missionId: Math.floor(Math.random() * 1000),
          digest: '0xMOCKMISSION' + Math.random().toString(36).substring(2),
        };
      }

      // Generate QR secret hash (32 bytes)
      const secret = qrSecret || Math.random().toString(36);
      const secretBuffer = Buffer.from(secret);
      const qrHash = new Array(32).fill(0);
      for (let i = 0; i < Math.min(secretBuffer.length, 32); i++) {
        qrHash[i] = secretBuffer[i];
      }

      // Fetch Event object metadata to get shared object info
      console.log('🔍 Fetching Event object metadata for:', eventId);
      const { getSuiClient } = await import('../services/suiClient.js');
      const suiClient = getSuiClient();
      const eventObject = await suiClient.getObject({
        id: eventId,
        options: {
          showOwner: true,
          showType: true,
        },
      });

      console.log('🔍 Full Event Object:', JSON.stringify(eventObject, null, 2));
      console.log('🔍 Event Object Owner:', JSON.stringify(eventObject.data?.owner));
      console.log('🔍 Event Object Type:', eventObject.data?.type);

      // Verify event is shared
      const owner = eventObject.data?.owner as any;
      console.log('🔍 Owner object:', owner);
      console.log('🔍 Owner.Shared:', owner?.Shared);

      if (!owner) {
        throw new Error(`Event object has no owner. Event ID: ${eventId}. Full object: ${JSON.stringify(eventObject)}`);
      }

      if (!owner.Shared) {
        throw new Error(`Event is not a shared object. Owner type: ${JSON.stringify(owner)}. Event ID: ${eventId}`);
      }

      const initialSharedVersion = owner.Shared.initial_shared_version;
      console.log('🔍 Event Shared Object Version:', initialSharedVersion);

      // Create transaction to create mission
      const tx = new Transaction();

      // Call mission::create_mission
      // For shared objects, we need to use sharedObjectRef with initial version
      tx.moveCall({
        target: `${config.packageId}::mission::create_mission`,
        arguments: [
          tx.object(adminCapId), // admin_cap (immutable reference)
          tx.sharedObjectRef({
            objectId: eventId,
            initialSharedVersion: initialSharedVersion,
            mutable: true, // &mut Event requires mutable
          }),
          tx.pure.vector('u8', Array.from(Buffer.from(title))),
          tx.pure.vector('u8', Array.from(Buffer.from(description))),
          tx.pure.u64(rewardAmount),
          tx.pure.vector('u8', qrHash), // qr_secret_hash
        ],
      });

      // Execute sponsored transaction
      console.log('🔄 Executing sponsored transaction...');
      const result = await sponsorTxService.executeFullySponsoredTransaction(tx);
      console.log('✅ Transaction executed successfully:', result.digest);

      // Extract mission ID from events
      const missionEvent = result.events?.find((event: any) =>
        event.type.includes('::mission::MissionCreated')
      );

      return {
        success: true,
        missionId: missionEvent?.parsedJson?.mission_id,
        digest: result.digest,
        qrSecret: secret,
      };
    } catch (error: any) {
      console.error('❌ Mission creation failed:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        data: error.data,
      });

      return reply.code(500).send({
        error: error.message || 'Mission creation failed',
        details: error.data || error.toString(),
      });
    }
  });

  /**
   * POST /api/admin/fund
   * Fund an event's grant pool
   */
  fastify.post<{
    Body: {
      eventId: string;
      amount: number; // in MIST
    };
  }>('/api/admin/fund', async (request, reply) => {
    try {
      const session = getSession(request);
      if (!session) {
        return reply.code(401).send({ error: 'Not authenticated' });
      }

      const { eventId, amount } = request.body;

      if (!eventId || !amount) {
        return reply.code(400).send({
          error: 'Missing required fields: eventId, amount',
        });
      }

      if (config.mockMode) {
        return {
          success: true,
          mock: true,
          digest: '0xMOCKFUND' + Math.random().toString(36).substring(2),
        };
      }

      // Create transaction to fund event
      const tx = new Transaction();

      // Split coin for payment
      const [coin] = tx.splitCoins(tx.gas, [amount]);

      // Call event::fund_event
      tx.moveCall({
        target: `${config.packageId}::event::fund_event`,
        arguments: [tx.object(eventId), coin],
      });

      // Execute sponsored transaction
      const result = await sponsorTxService.executeFullySponsoredTransaction(tx);

      return {
        success: true,
        digest: result.digest,
      };
    } catch (error: any) {
      console.error('Event funding failed:', error);
      return reply.code(500).send({
        error: error.message || 'Event funding failed',
      });
    }
  });

  /**
   * GET /api/admin/sponsor/balance
   * Get sponsor account balance
   */
  fastify.get('/api/admin/sponsor/balance', async (request, reply) => {
    try {
      const balance = await sponsorTxService.getSponsorBalance();

      return {
        address: sponsorTxService.getSponsorAddress(),
        balance: balance.toString(),
        balanceSui: (Number(balance) / 1_000_000_000).toFixed(4),
      };
    } catch (error: any) {
      console.error('Failed to get sponsor balance:', error);
      return reply.code(500).send({
        error: error.message || 'Failed to get balance',
      });
    }
  });
}

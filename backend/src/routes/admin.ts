import type { FastifyInstance } from 'fastify';
import { Transaction } from '@mysten/sui/transactions';
import { getSession } from './auth.js';
import type { AppConfig } from '../config.js';
import type { SponsoredTransactionService } from '../services/sponsoredTx.js';

export async function adminRoutes(
  fastify: FastifyInstance,
  config: AppConfig,
  sponsorTxService: SponsoredTransactionService
) {
  walrusService?: any,
  suinsService?: any
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

      if (!name || !description) {
        return reply.code(400).send({
          error: 'Missing required fields: name, description',
        });
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

      return {
        success: true,
        eventId: eventObj?.objectId,
        adminCapId: adminCapObj?.objectId,
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

      if (!eventId || !adminCapId || !title || !description || !rewardAmount) {
        return reply.code(400).send({
          error: 'Missing required fields: eventId, adminCapId, title, description, rewardAmount',
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

      // Generate QR secret hash
      const secret = qrSecret || Math.random().toString(36);
      const qrHash = Array.from(Buffer.from(secret).slice(0, 32).fill(0, Buffer.from(secret).length));

      // Create transaction to create mission
      const tx = new Transaction();

      // Call mission::create_mission
      tx.moveCall({
        target: `${config.packageId}::mission::create_mission`,
        arguments: [
          tx.object(adminCapId), // admin_cap
          tx.object(eventId), // event
          tx.pure.vector('u8', Array.from(Buffer.from(title))),
          tx.pure.vector('u8', Array.from(Buffer.from(description))),
          tx.pure.u64(rewardAmount),
          tx.pure.vector('u8', qrHash), // qr_secret_hash
        ],
      });

      // Execute sponsored transaction
      const result = await sponsorTxService.executeFullySponsoredTransaction(tx);

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
      console.error('Mission creation failed:', error);
      return reply.code(500).send({
        error: error.message || 'Mission creation failed',
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

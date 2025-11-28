/**
 * Events Routes - MODULE 6 Compliance
 *
 * Implements:
 * - GET /api/events - List all events
 * - GET /api/events/:id - Event details + missions
 */

import type { FastifyInstance } from 'fastify';
import { getSuiClient, getDynamicFields, getDynamicFieldObject } from '../services/suiClient.js';
import type { AppConfig } from '../config.js';
import type { SuiNSService } from '../services/suinsService.js';

// In-memory store for created event IDs (newest first)
// In production, this should be stored in a database
const createdEventIds: string[] = [];

// Export function to add event IDs when they're created
export function registerEventId(eventId: string) {
  // Add to beginning of array (newest first)
  if (!createdEventIds.includes(eventId)) {
    createdEventIds.unshift(eventId);
    console.log('📝 Registered new event ID:', eventId);
    console.log('📋 All registered events (newest first):', createdEventIds);
    console.log('Total registered events:', createdEventIds.length);
  }
}

export async function eventRoutes(
  fastify: FastifyInstance,
  config: AppConfig,
  suinsService?: SuiNSService
) {
  /**
   * GET /api/events
   * List all events (paginated)
   */
  fastify.get<{
    Querystring: {
      limit?: number;
      cursor?: string;
    };
  }>('/api/events', async (request, reply) => {
    try {
      const { limit = 10, cursor } = request.query;

      if (config.mockMode) {
        // Mock events for development
        return {
          events: [
            {
              id: '0xe13b43211fca648ff5a3198b3282d15a3c9c976ed922d418231f76680755710d',
              name: 'SUI Hackathon 2025',
              description: 'Build on SUI blockchain',
              organizer: '0x123...',
              startTime: Date.now(),
              endTime: Date.now() + 86400000,
              grantPoolBalance: 10_000_000_000,
              totalMissions: 3,
              active: true,
            },
            {
              id: '0xabc123...',
              name: 'ETHGeneva 2025',
              description: 'Ethereum conference',
              organizer: '0x456...',
              startTime: Date.now() + 86400000,
              endTime: Date.now() + 172800000,
              grantPoolBalance: 5_000_000_000,
              totalMissions: 5,
              active: true,
            },
          ],
          hasNextPage: false,
          nextCursor: null,
        };
      }

      // Query blockchain for events
      const suiClient = getSuiClient();

      // NOTE: Events are shared objects, not owned objects
      // For now, we'll fetch known event IDs from environment or database
      // In production, you might store event IDs in a database

      const eventIds: string[] = [];

      // Add all registered event IDs (created during this session) - FIRST (newest at index 0)
      createdEventIds.forEach(id => {
        if (!eventIds.includes(id)) {
          eventIds.push(id);
        }
      });

      // Add configured event ID if available
      if (process.env.EVENT_ID && !eventIds.includes(process.env.EVENT_ID)) {
        eventIds.push(process.env.EVENT_ID);
      }

      // Removed hardcoded DEFAULT_EVENT_ID to prevent old package events from showing
      // const DEFAULT_EVENT_ID = '0xe13b43211fca648ff5a3198b3282d15a3c9c976ed922d418231f76680755710d';
      // if (!eventIds.includes(DEFAULT_EVENT_ID)) {
      //   eventIds.push(DEFAULT_EVENT_ID);
      // }

      console.log(`📋 Fetching ${eventIds.length} events (newest first):`, eventIds);

      const events = await Promise.all(
        eventIds.map(async (eventId) => {
          try {
            const obj = await suiClient.getObject({
              id: eventId,
              options: {
                showContent: true,
                showType: true,
              },
            });

            const content = obj.data?.content as any;
            const fields = content?.fields;

            if (!fields) return null;

            // Resolve organizer name if SuiNS available
            let organizerName = fields.organizer;
            if (suinsService && suinsService.isEnabled()) {
              organizerName = await suinsService.formatAddress(fields.organizer);
            }

            return {
              id: obj.data!.objectId,
              objectType: obj.data!.type,
              name: fields.name,
              description: fields.description,
              organizer: fields.organizer,
              organizerName,
              startTime: parseInt(fields.start_time, 10),
              endTime: parseInt(fields.end_time, 10),
              grantPoolBalance: parseInt(fields.grant_pool?.fields?.value || '0', 10),
              totalMissions: parseInt(fields.total_missions, 10),
              active: fields.active,
            };
          } catch (error) {
            console.error(`Failed to fetch event ${eventId}:`, error);
            return null;
          }
        })
      );

      return {
        events: events.filter((e) => e !== null),
        hasNextPage: false,
        nextCursor: null,
      };
    } catch (error: any) {
      console.error('Failed to fetch events:', error);
      return reply.code(500).send({
        error: error.message || 'Failed to fetch events',
      });
    }
  });

  /**
   * GET /api/events/:id
   * Get event details + missions
   *
   * MODULE 6 REQUIREMENT: Event details with missions list
   */
  fastify.get<{
    Params: { id: string };
  }>('/api/events/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      if (config.mockMode) {
        // Mock event details
        return {
          event: {
            id,
            name: 'SUI Hackathon 2025',
            description: 'Build on SUI blockchain',
            organizer: '0x123...',
            organizerName: 'suihackathon.sui',
            startTime: Date.now(),
            endTime: Date.now() + 86400000,
            grantPoolBalance: 10_000_000_000,
            totalMissions: 3,
            active: true,
          },
          missions: [
            {
              missionId: 0,
              title: 'Check-in at Hackathon',
              description: 'Scan QR at entrance',
              rewardAmount: 100_000_000,
              active: true,
              completions: 5,
            },
            {
              missionId: 1,
              title: 'Attend Workshop',
              description: 'Participate in Move workshop',
              rewardAmount: 200_000_000,
              active: true,
              completions: 3,
            },
            {
              missionId: 2,
              title: 'Submit Project',
              description: 'Submit hackathon project',
              rewardAmount: 500_000_000,
              active: true,
              completions: 1,
            },
          ],
        };
      }

      // Query blockchain
      const suiClient = getSuiClient();

      // Get Event object
      const eventObj = await suiClient.getObject({
        id,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (!eventObj.data) {
        return reply.code(404).send({ error: 'Event not found' });
      }

      const content = eventObj.data.content as any;
      const fields = content?.fields;

      if (!fields) {
        return reply.code(404).send({ error: 'Invalid event object' });
      }

      // Resolve organizer name
      let organizerName = fields.organizer;
      if (suinsService && suinsService.isEnabled()) {
        organizerName = await suinsService.formatAddress(fields.organizer);
      }

      const event = {
        id: eventObj.data.objectId,
        objectType: eventObj.data.type,
        name: fields.name,
        description: fields.description,
        organizer: fields.organizer,
        organizerName,
        startTime: parseInt(fields.start_time, 10),
        endTime: parseInt(fields.end_time, 10),
        grantPoolBalance: parseInt(fields.grant_pool?.fields?.value || '0', 10),
        totalMissions: parseInt(fields.total_missions, 10),
        active: fields.active,
      };

      // Get missions from dynamic fields
      const dynamicFields = await getDynamicFields(id);

      const missions = await Promise.all(
        dynamicFields.data.map(async (field: any) => {
          const missionData = await getDynamicFieldObject(id, field.name);
          const missionContent = missionData.data?.content as any;
          const missionFields = missionContent?.fields?.value?.fields;

          if (!missionFields) return null;

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

      return {
        event,
        missions: missions.filter((m) => m !== null),
      };
    } catch (error: any) {
      console.error('Failed to fetch event:', error);
      return reply.code(500).send({
        error: error.message || 'Failed to fetch event',
      });
    }
  });
}

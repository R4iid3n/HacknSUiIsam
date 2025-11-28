/**
 * Rate Limiting Middleware for Fastify
 * Prevents abuse and ensures fair usage
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface RateLimitConfig {
  max: number; // Max requests
  windowMs: number; // Time window in milliseconds
  skipOnError?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (in production, use Redis)
const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}, 5 * 60 * 1000);

/**
 * Get client identifier for rate limiting
 */
function getClientId(request: FastifyRequest): string {
  // Use IP address or session ID
  const ip = request.ip || request.socket.remoteAddress || 'unknown';
  const sessionId = (request.cookies as { lemanflow_session?: string })?.lemanflow_session;
  return sessionId || ip;
}

/**
 * Rate limit middleware factory
 */
export function createRateLimit(config: RateLimitConfig) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const clientId = getClientId(request);
    const now = Date.now();
    
    // Get or create entry
    let entry = store[clientId];
    
    if (!entry || entry.resetTime < now) {
      // Create new entry
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      store[clientId] = entry;
    }
    
    // Increment count
    entry.count++;
    
    // Check limit
    if (entry.count > config.max) {
      reply.code(429).send({
        error: 'Too many requests',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      });
      return;
    }
    
    // Add headers
    reply.header('X-RateLimit-Limit', config.max.toString());
    reply.header('X-RateLimit-Remaining', Math.max(0, config.max - entry.count).toString());
    reply.header('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());
  };
}

/**
 * Rate limit configurations for different endpoints
 */
export const rateLimitConfigs = {
  // Strict rate limit for claim endpoint (prevent abuse)
  claim: {
    max: 10, // 10 requests
    windowMs: 60 * 1000, // per minute
  },
  
  // Moderate rate limit for auth endpoints
  auth: {
    max: 20, // 20 requests
    windowMs: 60 * 1000, // per minute
  },
  
  // Standard rate limit for other endpoints
  standard: {
    max: 100, // 100 requests
    windowMs: 60 * 1000, // per minute
  },
  
  // Lenient rate limit for read-only endpoints
  read: {
    max: 200, // 200 requests
    windowMs: 60 * 1000, // per minute
  },
};

/**
 * Register rate limiting plugin
 */
export async function registerRateLimit(fastify: FastifyInstance) {
  // Apply rate limiting to specific routes
  fastify.addHook('onRequest', async (request, reply) => {
    const path = request.url;
    
    // Apply different limits based on endpoint
    if (path.startsWith('/api/claim')) {
      await createRateLimit(rateLimitConfigs.claim)(request, reply);
    } else if (path.startsWith('/api/login') || path.startsWith('/api/logout')) {
      await createRateLimit(rateLimitConfigs.auth)(request, reply);
    } else if (path.startsWith('/api/admin')) {
      await createRateLimit(rateLimitConfigs.claim)(request, reply); // Strict for admin
    } else if (path.startsWith('/api/')) {
      await createRateLimit(rateLimitConfigs.standard)(request, reply);
    } else {
      await createRateLimit(rateLimitConfigs.read)(request, reply);
    }
  });
}


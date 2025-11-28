import type { FastifyInstance } from 'fastify';
import { verifyZkLogin, type ZkLoginPayload, type UserSession } from '../services/zkLogin.js';
import type { AppConfig } from '../config.js';

export async function authRoutes(fastify: FastifyInstance, config: AppConfig, enokiService?: any) {
  /**
   * POST /api/login
   * Login with zkLogin (Google, GitHub, etc.)
   */
  fastify.post<{ Body: ZkLoginPayload }>('/api/login', async (request, reply) => {
    try {
      const { jwt, provider, nonce, randomness } = request.body;

      if (!jwt || !provider) {
        return reply.code(400).send({
          error: 'Missing required fields: jwt, provider',
        });
      }

      // Verify zkLogin and get user session
      const session = await verifyZkLogin({ jwt, provider, nonce, randomness }, config);

      // Store session in cookie
      reply.setCookie('lemanflow_session', JSON.stringify(session), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: config.sessionMaxAge,
        path: '/',
      });

      return {
        success: true,
        user: {
          address: session.address,
          provider: session.provider,
          email: session.email,
          name: session.name,
        },
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return reply.code(401).send({
        error: error.message || 'Login failed',
      });
    }
  });

  /**
   * POST /api/login/wallet
   * Login with SUI wallet address (alternative to zkLogin)
   */
  fastify.post<{ Body: { address: string } }>('/api/login/wallet', async (request, reply) => {
    try {
      const { address } = request.body;

      console.log('🔐 Wallet login attempt:', address);

      if (!address || !address.startsWith('0x')) {
        return reply.code(400).send({
          error: 'Invalid wallet address',
        });
      }

      // Create session from wallet
      const session: UserSession = {
        address,
        provider: 'wallet',
        externalId: address,
        createdAt: Date.now(),
      };

      // Store session
      reply.setCookie('lemanflow_session', JSON.stringify(session), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: config.sessionMaxAge,
        path: '/',
      });

      return {
        success: true,
        user: {
          address: session.address,
          provider: 'wallet',
        },
      };
    } catch (error: any) {
      console.error('Wallet login error:', error);
      return reply.code(401).send({
        error: error.message || 'Login failed',
      });
    }
  });

  /**
   * GET /api/session
   * Get current session info
   */
  fastify.get('/api/session', async (request, reply) => {
    try {
      const sessionCookie = request.cookies.lemanflow_session;

      if (!sessionCookie) {
        return reply.code(401).send({
          error: 'No session found',
        });
      }

      const session: UserSession = JSON.parse(sessionCookie);

      // Check if session expired
      const age = Date.now() - session.createdAt;
      if (age > config.sessionMaxAge) {
        reply.clearCookie('lemanflow_session');
        return reply.code(401).send({
          error: 'Session expired',
        });
      }

      return {
        user: {
          address: session.address,
          provider: session.provider,
          email: session.email,
          name: session.name,
        },
      };
    } catch (error: any) {
      console.error('Session error:', error);
      return reply.code(401).send({
        error: 'Invalid session',
      });
    }
  });

  /**
   * GET /api/me
   * Get current user profile (alias for /api/session)
   * MODULE 6 compliance endpoint
   */
  fastify.get('/api/me', async (request, reply) => {
    try {
      const sessionCookie = request.cookies.lemanflow_session;

      if (!sessionCookie) {
        return reply.code(401).send({
          error: 'No session found',
        });
      }

      const session: UserSession = JSON.parse(sessionCookie);

      // Check if session expired
      const age = Date.now() - session.createdAt;
      if (age > config.sessionMaxAge) {
        reply.clearCookie('lemanflow_session');
        return reply.code(401).send({
          error: 'Session expired',
        });
      }

      return {
        user: {
          address: session.address,
          provider: session.provider,
          email: session.email,
          name: session.name,
        },
      };
    } catch (error: any) {
      console.error('Session error:', error);
      return reply.code(401).send({
        error: 'Invalid session',
      });
    }
  });

  /**
   * POST /api/logout
   * Logout and clear session
   */
  fastify.post('/api/logout', async (request, reply) => {
    reply.clearCookie('lemanflow_session');
    return { success: true };
  });
}

/**
 * Get current user session from request
 * Helper function for other routes
 */
export function getSession(request: any): UserSession | null {
  try {
    const sessionCookie = request.cookies.lemanflow_session;
    if (!sessionCookie) return null;

    const session: UserSession = JSON.parse(sessionCookie);

    // Check expiration
    const age = Date.now() - session.createdAt;
    if (age > 86400000) return null; // 24h

    return session;
  } catch {
    return null;
  }
}

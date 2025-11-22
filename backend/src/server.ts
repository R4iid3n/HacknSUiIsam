import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { config } from './config.js';
import { initializeSuiClient } from './services/suiClient.js';
import {
  SponsoredTransactionService,
  MockSponsoredTransactionService,
} from './services/sponsoredTx.js';
import { BackendWalrusService } from './services/walrusService.js';
import { EnokiService } from './services/enokiService.js';
import { SuiNSService } from './services/suinsService.js';
import { authRoutes } from './routes/auth.js';
import { missionRoutes } from './routes/missions.js';
import { passportRoutes } from './routes/passport.js';
import { adminRoutes } from './routes/admin.js';
import { eventRoutes } from './routes/events.js';

async function start() {
  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  // Register plugins
  await fastify.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
  });

  await fastify.register(cookie, {
    secret: config.sessionSecret,
    parseOptions: {},
  });

  // Initialize services
  console.log('🔧 Initializing services...');
  console.log('');

  const suiClient = initializeSuiClient(config);

  let sponsorTxService: SponsoredTransactionService | MockSponsoredTransactionService;

  if (config.mockMode) {
    console.log('🔶 Running in MOCK mode (no blockchain transactions)');
    sponsorTxService = new MockSponsoredTransactionService();
  } else {
    console.log('✅ Running in PRODUCTION mode (real blockchain transactions)');
    sponsorTxService = new SponsoredTransactionService(suiClient, config);

    // Check sponsor balance
    const balance = await sponsorTxService.getSponsorBalance();
    const balanceSui = (Number(balance) / 1_000_000_000).toFixed(4);
    console.log(`💰 Sponsor balance: ${balanceSui} SUI`);

    if (Number(balanceSui) < 1) {
      console.warn('⚠️  WARNING: Sponsor balance is low! Please fund the sponsor account.');
    }
  }

  // SUI Features Integration
  console.log('');
  console.log('🌟 Initializing SUI Features...');

  // Walrus - Decentralized Storage
  const walrusService = new BackendWalrusService(config);

  // Enoki - Managed zkLogin
  const enokiService = new EnokiService(config);

  // SuiNS - Name Service
  const suinsService = new SuiNSService(config, suiClient);

  console.log('');
  console.log('✅ SUI Features initialized:');
  console.log(`   - Walrus: ${walrusService.isEnabled() ? 'ENABLED' : 'disabled'}`);
  console.log(`   - Enoki: ${enokiService.isEnabled() ? 'ENABLED' : 'disabled (using fallback zkLogin)'}`);
  console.log(`   - SuiNS: ${suinsService.isEnabled() ? 'ENABLED' : 'disabled'}`);
  console.log('');

  // Register routes
  console.log('🛣️  Registering routes...');

  await authRoutes(fastify, config, enokiService);
  await eventRoutes(fastify, config, suinsService);
  await missionRoutes(fastify, config, sponsorTxService, walrusService, suinsService);
  await passportRoutes(fastify, config, sponsorTxService, walrusService);
  await adminRoutes(fastify, config, sponsorTxService, walrusService, suinsService);

  // Health check
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      mode: config.mockMode ? 'mock' : 'production',
      network: config.suiNetwork,
      packageId: config.packageId,
      timestamp: Date.now(),
      features: {
        walrus: walrusService.isEnabled(),
        enoki: enokiService.isEnabled(),
        suins: suinsService.isEnabled(),
      },
    };
  });

  // Root endpoint
  fastify.get('/', async () => {
    return {
      name: 'LémanFlow API',
      version: '1.0.0',
      description: 'Gasless hackathon rewards distribution on Sui blockchain',
      docs: 'https://github.com/your-repo/lemanflow',
      endpoints: {
        auth: [
          'POST /api/login',
          'POST /api/login/wallet',
          'GET /api/session',
          'GET /api/me',
          'POST /api/logout',
        ],
        events: [
          'GET /api/events',
          'GET /api/events/:id',
        ],
        missions: [
          'GET /api/missions?eventId=<id>',
          'GET /api/missions/:id/qr?eventId=<id>',
          'POST /api/scan',
        ],
        passport: ['GET /api/passport', 'POST /api/passport/register', 'POST /api/claim'],
        admin: [
          'POST /api/admin/init',
          'POST /api/admin/missions',
          'POST /api/admin/fund',
          'GET /api/admin/sponsor/balance',
        ],
        health: ['GET /health'],
      },
    };
  });

  // Start server
  try {
    await fastify.listen({
      port: config.port,
      host: config.host,
    });

    console.log('');
    console.log('🚀 LémanFlow Backend started successfully!');
    console.log('');
    console.log(`📍 Server: http://${config.host}:${config.port}`);
    console.log(`📍 Health: http://${config.host}:${config.port}/health`);
    console.log(`📍 Docs: http://${config.host}:${config.port}/`);
    console.log('');
    console.log(`🌐 Network: ${config.suiNetwork}`);
    console.log(`📦 Package: ${config.packageId}`);
    console.log(`🎯 Mode: ${config.mockMode ? 'MOCK (dev)' : 'PRODUCTION'}`);
    console.log('');
    console.log('✨ Ready to accept requests!');
    console.log('');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

start();

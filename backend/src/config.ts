import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

export interface AppConfig {
  // Server
  port: number;
  host: string;
  corsOrigin: string;

  // Sui Network
  suiNetwork: 'mainnet' | 'testnet' | 'devnet' | 'localnet';
  suiRpcUrl: string;

  // Smart Contracts
  packageId: string;

  // Sponsor Account (for gasless transactions)
  sponsorPrivateKey: string;
  sponsorAddress: string;

  // QR Signing
  qrSecret: string;

  // zkLogin (OAuth)
  googleClientId?: string;
  githubClientId?: string;
  githubClientSecret?: string;

  // Session
  sessionSecret: string;
  sessionMaxAge: number; // milliseconds

  // Mock mode (for development without blockchain)
  mockMode: boolean;
}

export const config: AppConfig = {
  // Server
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Sui Network
  suiNetwork: (process.env.SUI_NETWORK as any) || 'testnet',
  suiRpcUrl:
    process.env.SUI_RPC_URL ||
    'https://fullnode.testnet.sui.io:443',

  // Smart Contracts
  packageId: process.env.PACKAGE_ID || '0x0',

  // Sponsor Account (CRITICAL: must be set for gasless transactions)
  sponsorPrivateKey: process.env.SPONSOR_PRIVATE_KEY || '',
  sponsorAddress: process.env.SPONSOR_ADDRESS || '',

  // QR Signing
  qrSecret: process.env.QR_SECRET || 'change-me-in-production',

  // zkLogin
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  githubClientId: process.env.GITHUB_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET,

  // Session
  sessionSecret: process.env.SESSION_SECRET || 'change-me-in-production',
  sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000', 10), // 24h default

  // Mock mode
  mockMode: process.env.MOCK_MODE === 'true' || !process.env.SPONSOR_PRIVATE_KEY,
};

// Validation
if (!config.mockMode && !config.sponsorPrivateKey) {
  console.warn(
    '⚠️  SPONSOR_PRIVATE_KEY not set - running in MOCK mode (no blockchain transactions)'
  );
  config.mockMode = true;
}

if (!config.mockMode && config.packageId === '0x0') {
  console.warn('⚠️  PACKAGE_ID not set - please deploy contracts first');
}

console.log('📋 Configuration loaded:');
console.log(`   Network: ${config.suiNetwork}`);
console.log(`   Mock Mode: ${config.mockMode ? 'YES (dev only)' : 'NO (production)'}`);
console.log(`   Package ID: ${config.packageId.slice(0, 20)}...`);
console.log(`   Sponsor: ${config.sponsorAddress.slice(0, 20)}...` || 'NOT SET');

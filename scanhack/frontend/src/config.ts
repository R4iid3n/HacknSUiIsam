/**
 * ScanHack Configuration
 * Canister IDs and environment settings
 */

export const CANISTER_IDS = {
  registry: process.env.NEXT_PUBLIC_REGISTRY_CANISTER_ID || '',
  missions: process.env.NEXT_PUBLIC_MISSIONS_CANISTER_ID || '',
  grantvault: process.env.NEXT_PUBLIC_GRANTVAULT_CANISTER_ID || '',
  backend: process.env.NEXT_PUBLIC_BACKEND_CANISTER_ID || '',
};

export const IC_HOST =
  process.env.NEXT_PUBLIC_IC_HOST || 'http://localhost:8000';

export const IDENTITY_PROVIDER =
  process.env.NEXT_PUBLIC_IC_IDENTITY_PROVIDER ||
  'https://identity.ic0.app';

export const IS_LOCAL = process.env.NODE_ENV === 'development';


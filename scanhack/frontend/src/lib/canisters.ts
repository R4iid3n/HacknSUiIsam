/**
 * Canister Actors
 * TypeScript interfaces and actor creation for ICP canisters
 */

import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { CANISTER_IDS, IC_HOST } from '@/config';

// Types from canisters
export interface QRPayload {
  eventId: string;
  missionId: string;
  nonce: string;
  signature: Array<number>; // Blob as Uint8Array
  expiresAt: bigint; // Nat64
}

export interface Mission {
  id: string;
  eventId: string;
  title: string;
  description: string;
  rewardAmount: bigint;
  active: boolean;
  completions: bigint;
  createdAt: bigint;
}

export interface Attestation {
  id: string;
  userId: Principal;
  hackPassId: string;
  missionId: string;
  eventId: string;
  completedAt: bigint;
  rewardAmount: bigint;
}

export interface HackPass {
  id: string;
  userId: Principal;
  eventId: string;
  createdAt: bigint;
  attestationCount: bigint;
}

export interface User {
  id: Principal;
  createdAt: bigint;
  hackPasses: string[];
}

export interface Grant {
  id: string;
  userId: Principal;
  eventId: string;
  amount: bigint;
  missionId: string;
  distributedAt: bigint;
}

export interface Vault {
  eventId: string;
  totalCycles: bigint;
  distributedCycles: bigint;
  createdAt: bigint;
}

// Backend Canister Interface
export interface BackendActor {
  generateQRPayload: (
    eventId: string,
    missionId: string,
    expiresInSeconds: bigint
  ) => Promise<{ ok?: QRPayload; err?: string }>;
  completeMission: (
    qrPayload: QRPayload
  ) => Promise<{
    ok?: { attestation: Attestation; grant: [] | [Grant] };
    err?: string;
  }>;
  getUserData: (
    eventId: [] | [string]
  ) => Promise<{
    user: User;
    hackPass: [] | [HackPass];
    attestations: Attestation[];
    grants: Grant[];
  }>;
  createEvent: (
    eventId: string,
    initialVaultCycles: bigint
  ) => Promise<{ ok?: null; err?: string }>;
}

// Missions Canister Interface
export interface MissionsActor {
  createMission: (
    eventId: string,
    title: string,
    description: string,
    rewardAmount: bigint
  ) => Promise<{ ok?: Mission; err?: string }>;
  getMissions: (eventId: string) => Promise<Mission[]>;
  getUserAttestations: (userId: Principal) => Promise<Attestation[]>;
  getMission: (missionId: string) => Promise<[] | [Mission]>;
  setMissionActive: (
    missionId: string,
    active: boolean
  ) => Promise<{ ok?: null; err?: string }>;
}

// Registry Canister Interface
export interface RegistryActor {
  register: () => Promise<{ ok?: User; err?: string }>;
  getOrCreateUser: () => Promise<User>;
  mintHackPass: (eventId: string) => Promise<{ ok?: HackPass; err?: string }>;
  getHackPass: (
    userId: Principal,
    eventId: string
  ) => Promise<[] | [HackPass]>;
  getUser: (userId: Principal) => Promise<[] | [User]>;
}

// GrantVault Canister Interface
export interface GrantVaultActor {
  createVault: (
    eventId: string,
    initialCycles: bigint
  ) => Promise<{ ok?: Vault; err?: string }>;
  fundVault: (
    eventId: string,
    amount: bigint
  ) => Promise<{ ok?: Vault; err?: string }>;
  getVaultBalance: (eventId: string) => Promise<[] | [bigint]>;
  getUserGrants: (userId: Principal) => Promise<Grant[]>;
  getVault: (eventId: string) => Promise<[] | [Vault]>;
}

/**
 * Create actor for a canister
 */
export function createActor<T>(
  canisterId: string,
  idlFactory: any,
  identity?: any
): T {
  const agent = new HttpAgent({
    host: IC_HOST,
    identity,
  });

  // For local development, fetch root key
  if (IC_HOST.includes('localhost')) {
    agent.fetchRootKey().catch((err) => {
      console.warn('Failed to fetch root key:', err);
    });
  }

  return Actor.createActor<T>(idlFactory, {
    agent,
    canisterId,
  });
}

/**
 * Helper to convert QRPayload from canister format to frontend format
 */
export function convertQRPayload(payload: QRPayload): {
  eventId: string;
  missionId: string;
  nonce: string;
  signature: string;
  expiresAt: number;
} {
  return {
    eventId: payload.eventId,
    missionId: payload.missionId,
    nonce: payload.nonce,
    signature: Buffer.from(payload.signature).toString('base64'),
    expiresAt: Number(payload.expiresAt / BigInt(1_000_000)), // Convert nanoseconds to milliseconds
  };
}

/**
 * Helper to convert QRPayload from frontend format to canister format
 */
export function convertQRPayloadToCanister(payload: {
  eventId: string;
  missionId: string;
  nonce: string;
  signature: string;
  expiresAt: number;
}): QRPayload {
  return {
    eventId: payload.eventId,
    missionId: payload.missionId,
    nonce: payload.nonce,
    signature: Array.from(Buffer.from(payload.signature, 'base64')),
    expiresAt: BigInt(payload.expiresAt) * BigInt(1_000_000), // Convert milliseconds to nanoseconds
  };
}


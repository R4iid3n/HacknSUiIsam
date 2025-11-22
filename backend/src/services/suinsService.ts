/**
 * SuiNS Service - Sui Name Service Integration
 *
 * Allows event organizers to use human-readable names like "ethgeneva.sui"
 * instead of hex addresses for their events
 *
 * Feature: SuiNS integration for hackathon points
 *
 * Documentation: https://docs.sui.io/standards/sui-ns
 */

import { SuiClient } from '@mysten/sui/client';
import type { AppConfig } from '../config.js';

export interface SuiNSName {
  name: string;
  address: string;
  expirationTimestamp: number;
  avatar?: string;
  contentHash?: string;
}

/**
 * SuiNS Service for resolving .sui names
 */
export class SuiNSService {
  private client: SuiClient;
  private packageId: string;
  private registryId: string;
  private enabled: boolean;

  constructor(config: AppConfig, client: SuiClient) {
    this.client = client;
    // SuiNS package on testnet
    this.packageId = process.env.SUINS_PACKAGE_ID || '0x22fa05f21b1ad71442491220bb9338f7b7095fe35000ef88d5400d28523bdd93';
    this.registryId = process.env.SUINS_REGISTRY_ID || '0xe64cd9db9f829c6cc405d9790bd71567ae07259855f4fba6f02c84f52298c106';
    this.enabled = !config.mockMode;

    if (this.enabled) {
      console.log('✅ SuiNS service initialized');
    }
  }

  /**
   * Resolve a .sui name to an address
   * Example: "ethgeneva.sui" -> "0x123..."
   */
  async resolve(name: string): Promise<string | null> {
    if (!this.enabled) {
      console.log(`📦 Mock: SuiNS resolve ${name} skipped`);
      return null;
    }

    try {
      // Normalize name (remove .sui if present)
      const normalizedName = name.toLowerCase().replace('.sui', '');

      // Query SuiNS registry
      const result = await this.client.getDynamicFieldObject({
        parentId: this.registryId,
        name: {
          type: '0x1::string::String',
          value: normalizedName,
        },
      });

      if (!result.data) {
        return null;
      }

      // Extract address from registry entry
      const content = result.data.content as any;
      const address = content.fields?.target_address || content.fields?.value?.fields?.target_address;

      console.log(`✅ SuiNS resolved ${name} -> ${address?.slice(0, 10)}...`);

      return address || null;
    } catch (error) {
      console.error(`❌ Failed to resolve SuiNS name ${name}:`, error);
      return null;
    }
  }

  /**
   * Reverse lookup: address to .sui name
   */
  async reverseLookup(address: string): Promise<string | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      // Query reverse registry
      // Note: This requires additional SuiNS registry queries
      // For MVP, we return null

      console.log(`⚠️  SuiNS reverse lookup not yet implemented for ${address.slice(0, 10)}...`);
      return null;
    } catch (error) {
      console.error('❌ Failed to reverse lookup SuiNS name:', error);
      return null;
    }
  }

  /**
   * Get full SuiNS profile (name, avatar, etc.)
   */
  async getProfile(name: string): Promise<SuiNSName | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      const address = await this.resolve(name);
      if (!address) {
        return null;
      }

      // Query full profile from registry
      const normalizedName = name.toLowerCase().replace('.sui', '');

      const result = await this.client.getDynamicFieldObject({
        parentId: this.registryId,
        name: {
          type: '0x1::string::String',
          value: normalizedName,
        },
      });

      if (!result.data) {
        return null;
      }

      const content = result.data.content as any;
      const fields = content.fields?.value?.fields || content.fields;

      return {
        name: `${normalizedName}.sui`,
        address,
        expirationTimestamp: parseInt(fields.expiration_timestamp_ms || '0', 10),
        avatar: fields.avatar,
        contentHash: fields.content_hash,
      };
    } catch (error) {
      console.error(`❌ Failed to get SuiNS profile for ${name}:`, error);
      return null;
    }
  }

  /**
   * Validate if a name is available for registration
   */
  async isAvailable(name: string): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    const address = await this.resolve(name);
    return address === null;
  }

  /**
   * Format address with SuiNS name if available
   * Example: "0x123..." -> "ethgeneva.sui (0x123...)"
   */
  async formatAddress(address: string): Promise<string> {
    if (!this.enabled) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    const name = await this.reverseLookup(address);
    if (name) {
      return `${name} (${address.slice(0, 6)}...${address.slice(-4)})`;
    }

    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Check if SuiNS is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

/**
 * USAGE EXAMPLE:
 *
 * // In admin route, allow creating event with SuiNS name:
 * POST /api/admin/init
 * {
 *   "name": "ETHGeneva 2025",
 *   "suinsName": "ethgeneva.sui",  // Optional SuiNS name
 *   ...
 * }
 *
 * // Resolve organizer address:
 * const organizerAddress = await suinsService.resolve("ethgeneva.sui");
 *
 * // Display event with SuiNS name:
 * Event: ETHGeneva 2025 (ethgeneva.sui)
 */

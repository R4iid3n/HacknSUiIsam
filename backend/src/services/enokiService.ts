/**
 * Enoki Service - Managed zkLogin
 *
 * Integration with Mysten's Enoki for managed zkLogin authentication
 * Feature: Enoki integration for hackathon points
 *
 * Documentation: https://docs.enoki.mystenlabs.com/
 */

import type { AppConfig } from '../config.js';
import type { UserSession } from './zkLogin.js';

export interface EnokiLoginPayload {
  jwt: string;
  provider: 'google' | 'facebook' | 'twitch';
  ephemeralKeyPair?: string;
  maxEpoch?: number;
}

/**
 * Enoki Managed zkLogin Service
 */
export class EnokiService {
  private apiKey: string;
  private apiUrl: string;
  private enabled: boolean;

  constructor(config: AppConfig) {
    this.apiKey = process.env.ENOKI_API_KEY || '';
    this.apiUrl = process.env.ENOKI_API_URL || 'https://api.enoki.mystenlabs.com';
    this.enabled = !!this.apiKey && !config.mockMode;

    if (this.enabled) {
      console.log('✅ Enoki managed zkLogin service initialized');
    } else if (!config.mockMode && !this.apiKey) {
      console.log('⚠️  Enoki API key not set, using fallback zkLogin');
    }
  }

  /**
   * Verify zkLogin JWT using Enoki
   */
  async verifyZkLogin(payload: EnokiLoginPayload): Promise<UserSession> {
    if (!this.enabled) {
      throw new Error('Enoki service not enabled');
    }

    try {
      // Call Enoki API to verify JWT and get Sui address
      const response = await fetch(`${this.apiUrl}/v1/zklogin/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          jwt: payload.jwt,
          provider: payload.provider,
        }),
      });

      if (!response.ok) {
        throw new Error(`Enoki verification failed: ${response.statusText}`);
      }

      const data = (await response.json()) as any;

      // Extract user info
      const session: UserSession = {
        address: data.address,
        provider: payload.provider,
        externalId: data.sub || data.userId,
        email: data.email,
        name: data.name,
        createdAt: Date.now(),
      };

      console.log(`✅ Enoki zkLogin verified for ${session.address.slice(0, 10)}...`);

      return session;
    } catch (error) {
      console.error('❌ Enoki zkLogin verification failed:', error);
      throw new Error('zkLogin verification failed');
    }
  }

  /**
   * Generate zkLogin nonce using Enoki
   */
  async generateNonce(): Promise<string> {
    if (!this.enabled) {
      // Fallback to simple nonce
      return Math.random().toString(36).substring(2, 15);
    }

    try {
      const response = await fetch(`${this.apiUrl}/v1/zklogin/nonce`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Nonce generation failed');
      }

      const data = (await response.json()) as any;
      return data.nonce;
    } catch (error) {
      console.error('❌ Enoki nonce generation failed:', error);
      // Fallback
      return Math.random().toString(36).substring(2, 15);
    }
  }

  /**
   * Get OAuth URL from Enoki
   */
  async getOAuthURL(provider: 'google' | 'facebook' | 'twitch', redirectUrl: string): Promise<string> {
    if (!this.enabled) {
      throw new Error('Enoki service not enabled');
    }

    try {
      const response = await fetch(`${this.apiUrl}/v1/zklogin/oauth-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          provider,
          redirectUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('OAuth URL generation failed');
      }

      const data = (await response.json()) as any;
      return data.url;
    } catch (error) {
      console.error('❌ Enoki OAuth URL generation failed:', error);
      throw new Error('OAuth URL generation failed');
    }
  }

  /**
   * Check if Enoki is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

/**
 * NOTE: To enable Enoki, add to .env:
 *
 * ENOKI_API_KEY=your_enoki_api_key
 * ENOKI_API_URL=https://api.enoki.mystenlabs.com
 *
 * Get API key from: https://enoki.mystenlabs.com/
 */

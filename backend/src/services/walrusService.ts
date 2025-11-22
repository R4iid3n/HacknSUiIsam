/**
 * Walrus Storage Service - Backend
 *
 * Stores QR codes and attestation metadata on Walrus decentralized storage
 * Feature: Walrus integration for hackathon points
 */

import { SuiClient } from '@mysten/sui/client';
import { getFullnodeUrl } from '@mysten/sui/client';
import { walrus, WalrusFile } from '@mysten/walrus';
import type { AppConfig } from '../config.js';

export interface QRMetadata {
  eventId: string;
  missionId: number;
  title: string;
  timestamp: number;
  signature: string;
}

export interface AttestationMetadata {
  passportId: string;
  eventId: string;
  eventName: string;
  missionId: number;
  missionTitle: string;
  completedAt: number;
  rewardAmount: number;
  transactionDigest: string;
}

/**
 * Backend Walrus Service
 */
export class BackendWalrusService {
  private client: any;
  private enabled: boolean;

  constructor(config: AppConfig) {
    this.enabled = !config.mockMode;

    if (this.enabled) {
      try {
        const suiClient = new SuiClient({ url: config.suiRpcUrl });

        this.client = (suiClient as any).$extend(
          walrus({
            wasmUrl:
              'https://unpkg.com/@mysten/walrus-wasm@latest/web/walrus_wasm_bg.wasm',
          })
        );

        console.log('✅ Walrus storage service initialized');
      } catch (error) {
        console.warn('⚠️  Walrus initialization failed, storage disabled:', error);
        this.enabled = false;
      }
    } else {
      console.log('📦 Walrus storage disabled (mock mode)');
    }
  }

  /**
   * Store QR code metadata on Walrus
   * Returns Walrus blob ID
   */
  async storeQRMetadata(metadata: QRMetadata): Promise<string | null> {
    if (!this.enabled) {
      console.log('📦 Mock: QR metadata storage skipped');
      return null;
    }

    try {
      const jsonData = JSON.stringify(metadata);
      const contents = new TextEncoder().encode(jsonData);

      const file = WalrusFile.from({
        contents,
        identifier: `qr-${metadata.eventId}-${metadata.missionId}`,
        tags: {
          type: 'qr-metadata',
          eventId: metadata.eventId,
          missionId: metadata.missionId.toString(),
        },
      });

      const result = await this.client.walrus.writeFilesFlow({
        files: [file],
      });

      // Get blob ID from result
      const blobId = result?.newlyCreated?.blobObject?.blobId ||
                     result?.alreadyCertified?.blobId;

      console.log(`✅ QR metadata stored on Walrus: ${blobId}`);
      return blobId;
    } catch (error) {
      console.error('❌ Failed to store QR metadata on Walrus:', error);
      return null;
    }
  }

  /**
   * Store attestation metadata on Walrus
   * Returns Walrus blob ID
   */
  async storeAttestationMetadata(
    metadata: AttestationMetadata
  ): Promise<string | null> {
    if (!this.enabled) {
      console.log('📦 Mock: Attestation metadata storage skipped');
      return null;
    }

    try {
      const jsonData = JSON.stringify(metadata);
      const contents = new TextEncoder().encode(jsonData);

      const file = WalrusFile.from({
        contents,
        identifier: `attestation-${metadata.passportId}-${metadata.eventId}-${metadata.missionId}`,
        tags: {
          type: 'attestation-metadata',
          passportId: metadata.passportId,
          eventId: metadata.eventId,
          missionId: metadata.missionId.toString(),
        },
      });

      const result = await this.client.walrus.writeFilesFlow({
        files: [file],
      });

      const blobId = result?.newlyCreated?.blobObject?.blobId ||
                     result?.alreadyCertified?.blobId;

      console.log(`✅ Attestation metadata stored on Walrus: ${blobId}`);
      return blobId;
    } catch (error) {
      console.error('❌ Failed to store attestation metadata on Walrus:', error);
      return null;
    }
  }

  /**
   * Retrieve QR metadata from Walrus
   */
  async retrieveQRMetadata(blobId: string): Promise<QRMetadata | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      const [file] = await this.client.walrus.getFiles({ ids: [blobId] });
      const data = await file.json();
      return data as QRMetadata;
    } catch (error) {
      console.error('❌ Failed to retrieve QR metadata from Walrus:', error);
      return null;
    }
  }

  /**
   * Retrieve attestation metadata from Walrus
   */
  async retrieveAttestationMetadata(
    blobId: string
  ): Promise<AttestationMetadata | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      const [file] = await this.client.walrus.getFiles({ ids: [blobId] });
      const data = await file.json();
      return data as AttestationMetadata;
    } catch (error) {
      console.error('❌ Failed to retrieve attestation metadata from Walrus:', error);
      return null;
    }
  }

  /**
   * Store arbitrary JSON data on Walrus
   */
  async storeJSON<T>(data: T, identifier: string, tags?: Record<string, string>): Promise<string | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      const jsonData = JSON.stringify(data);
      const contents = new TextEncoder().encode(jsonData);

      const file = WalrusFile.from({
        contents,
        identifier,
        tags,
      });

      const result = await this.client.walrus.writeFilesFlow({
        files: [file],
      });

      const blobId = result?.newlyCreated?.blobObject?.blobId ||
                     result?.alreadyCertified?.blobId;

      return blobId;
    } catch (error) {
      console.error('❌ Failed to store JSON on Walrus:', error);
      return null;
    }
  }

  /**
   * Check if Walrus is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

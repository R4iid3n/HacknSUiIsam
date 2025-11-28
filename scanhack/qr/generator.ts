/**
 * QR Code Generator for ScanHack
 * Generates signed QR codes for missions with nonce and ECDSA signature
 */

import { createHash, createSign } from 'crypto';

export interface QRPayload {
  eventId: string;
  missionId: string;
  nonce: string;
  signature: string;
  expiresAt: number;
}

export interface QRGenerationOptions {
  eventId: string;
  missionId: string;
  expiresInSeconds?: number;
  privateKey: string; // ECDSA private key
}

/**
 * Generate a unique nonce
 */
export function generateNonce(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}_${random}`;
}

/**
 * Sign QR payload with ECDSA
 */
export function signQRPayload(
  eventId: string,
  missionId: string,
  nonce: string,
  privateKey: string
): string {
  const data = `${eventId}:${missionId}:${nonce}`;
  const sign = createSign('sha256');
  sign.update(data);
  sign.end();
  return sign.sign(privateKey, 'base64');
}

/**
 * Generate QR payload with signature
 */
export function generateQRPayload(options: QRGenerationOptions): QRPayload {
  const {
    eventId,
    missionId,
    expiresInSeconds = 3600, // 1 hour default
    privateKey,
  } = options;

  const nonce = generateNonce();
  const signature = signQRPayload(eventId, missionId, nonce, privateKey);
  const expiresAt = Date.now() + expiresInSeconds * 1000;

  return {
    eventId,
    missionId,
    nonce,
    signature,
    expiresAt,
  };
}

/**
 * Verify QR payload signature
 */
export function verifyQRPayload(
  payload: QRPayload,
  publicKey: string
): boolean {
  const { eventId, missionId, nonce, signature, expiresAt } = payload;

  // Check expiration
  if (Date.now() > expiresAt) {
    return false;
  }

  // Verify signature
  const data = `${eventId}:${missionId}:${nonce}`;
  const crypto = require('crypto');
  const verify = crypto.createVerify('sha256');
  verify.update(data);
  verify.end();

  try {
    return verify.verify(publicKey, signature, 'base64');
  } catch {
    return false;
  }
}

/**
 * Convert QR payload to JSON string for QR code
 */
export function payloadToJSON(payload: QRPayload): string {
  return JSON.stringify(payload);
}

/**
 * Parse QR payload from JSON string
 */
export function payloadFromJSON(json: string): QRPayload | null {
  try {
    const parsed = JSON.parse(json);
    // Validate structure
    if (
      parsed.eventId &&
      parsed.missionId &&
      parsed.nonce &&
      parsed.signature &&
      parsed.expiresAt
    ) {
      return parsed as QRPayload;
    }
    return null;
  } catch {
    return null;
  }
}


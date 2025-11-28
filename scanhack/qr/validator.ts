/**
 * QR Code Validator for ScanHack
 * Validates QR codes with nonce tracking and signature verification
 */

import { QRPayload, verifyQRPayload } from './generator';

export interface NonceTracker {
  usedNonces: Set<string>;
  maxAge: number; // milliseconds
}

/**
 * Create a nonce tracker
 */
export function createNonceTracker(maxAgeMinutes: number = 60): NonceTracker {
  return {
    usedNonces: new Set(),
    maxAge: maxAgeMinutes * 60 * 1000,
  };
}

/**
 * Check if nonce has been used
 */
export function isNonceUsed(tracker: NonceTracker, nonce: string): boolean {
  return tracker.usedNonces.has(nonce);
}

/**
 * Mark nonce as used
 */
export function markNonceUsed(tracker: NonceTracker, nonce: string): void {
  tracker.usedNonces.add(nonce);

  // Cleanup old nonces (simplified - in production, use proper cleanup)
  setTimeout(() => {
    tracker.usedNonces.delete(nonce);
  }, tracker.maxAge);
}

/**
 * Validate QR payload
 */
export function validateQRPayload(
  payload: QRPayload,
  publicKey: string,
  tracker: NonceTracker
): {
  valid: boolean;
  error?: string;
} {
  // 1. Check expiration
  if (Date.now() > payload.expiresAt) {
    return {
      valid: false,
      error: 'QR code expired',
    };
  }

  // 2. Check nonce not used (anti-replay)
  if (isNonceUsed(tracker, payload.nonce)) {
    return {
      valid: false,
      error: 'QR code already used',
    };
  }

  // 3. Verify signature
  if (!verifyQRPayload(payload, publicKey)) {
    return {
      valid: false,
      error: 'Invalid signature',
    };
  }

  // 4. Mark nonce as used
  markNonceUsed(tracker, payload.nonce);

  return {
    valid: true,
  };
}


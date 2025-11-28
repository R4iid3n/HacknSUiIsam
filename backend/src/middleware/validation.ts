/**
 * Input Validation Middleware
 * Ensures all inputs are validated before processing
 */

import type { FastifyRequest, FastifyReply } from 'fastify';

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate event ID format
 */
export function validateEventId(eventId: unknown): eventId is string {
  if (typeof eventId !== 'string') return false;
  // Sui object ID format: 0x followed by 64 hex characters
  return /^0x[a-fA-F0-9]{64}$/.test(eventId);
}

/**
 * Validate mission ID
 */
export function validateMissionId(missionId: unknown): missionId is number {
  return typeof missionId === 'number' && missionId >= 0 && Number.isInteger(missionId);
}

/**
 * Validate address format
 */
export function validateAddress(address: unknown): address is string {
  if (typeof address !== 'string') return false;
  // Sui address format: 0x followed by 64 hex characters
  return /^0x[a-fA-F0-9]{64}$/.test(address);
}

/**
 * Validate non-empty string
 */
export function validateNonEmptyString(value: unknown, fieldName: string): value is string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  if (value.trim().length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }
  return true;
}

/**
 * Validate positive number
 */
export function validatePositiveNumber(value: unknown, fieldName: string): value is number {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`${fieldName} must be a number`);
  }
  if (value <= 0) {
    throw new Error(`${fieldName} must be positive`);
  }
  return true;
}

/**
 * Validate timestamp
 */
export function validateTimestamp(timestamp: unknown): timestamp is number {
  if (typeof timestamp !== 'number') return false;
  // Must be reasonable (between 2020 and 2100)
  const minTimestamp = new Date('2020-01-01').getTime();
  const maxTimestamp = new Date('2100-01-01').getTime();
  return timestamp >= minTimestamp && timestamp <= maxTimestamp;
}

/**
 * Validate request body structure
 */
export function validateRequestBody<T>(
  body: unknown,
  validators: Record<string, (value: unknown) => boolean>
): T {
  if (typeof body !== 'object' || body === null) {
    throw new Error('Request body must be an object');
  }

  const errors: ValidationError[] = [];
  const validated: Record<string, unknown> = {};

  for (const [field, validator] of Object.entries(validators)) {
    const value = (body as Record<string, unknown>)[field];
    if (!validator(value)) {
      errors.push({
        field,
        message: `Invalid value for ${field}`,
      });
    } else {
      validated[field] = value;
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
  }

  return validated as T;
}

/**
 * Error handler for validation errors
 */
export function handleValidationError(error: unknown, reply: FastifyReply) {
  if (error instanceof Error) {
    if (error.message.includes('Validation failed') || error.message.includes('must be')) {
      return reply.code(400).send({
        error: 'Validation failed',
        message: error.message,
      });
    }
  }
  throw error; // Re-throw if not a validation error
}


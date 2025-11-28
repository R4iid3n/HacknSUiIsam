/**
 * Centralized Error Handling Middleware
 * Provides consistent error responses across all routes
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  statusCode: number,
  message: string,
  code?: string,
  details?: unknown
) {
  const error: {
    statusCode: number;
    message: string;
    code: string;
    details?: unknown;
    timestamp: string;
  } = {
      statusCode,
      message,
      code: code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
  };
  
  if (details) {
    error.details = details;
  }
  
  return { error };
}

/**
 * Register global error handler
 */
export function registerErrorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: AppError, request: FastifyRequest, reply: FastifyReply) => {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    const code = error.code || 'INTERNAL_ERROR';

    // Log error (in production, use proper logging service)
    if (statusCode >= 500) {
      console.error('Server error:', {
        error: error.message,
        stack: error.stack,
        url: request.url,
        method: request.method,
        statusCode,
      });
    } else {
      console.warn('Client error:', {
        error: error.message,
        url: request.url,
        method: request.method,
        statusCode,
      });
    }

    // Don't expose internal errors in production
    const isProduction = process.env.NODE_ENV === 'production';
    const errorMessage = isProduction && statusCode >= 500 
      ? 'An internal error occurred' 
      : message;

    reply.code(statusCode).send(createErrorResponse(statusCode, errorMessage, code));
  });

  // Handle 404
  fastify.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    reply.code(404).send(createErrorResponse(404, 'Route not found', 'NOT_FOUND'));
  });
}

/**
 * Common error classes
 */
export class ValidationError extends Error implements AppError {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.details = details;
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error implements AppError {
  statusCode = 401;
  code = 'AUTHENTICATION_ERROR';

  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error implements AppError {
  statusCode = 403;
  code = 'AUTHORIZATION_ERROR';

  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error implements AppError {
  statusCode = 404;
  code = 'NOT_FOUND';

  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends Error implements AppError {
  statusCode = 429;
  code = 'RATE_LIMIT_EXCEEDED';

  constructor(message: string = 'Too many requests') {
    super(message);
    this.name = 'RateLimitError';
  }
}


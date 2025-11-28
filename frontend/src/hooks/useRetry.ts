/**
 * Retry Hook
 * Provides retry logic for async operations
 */

import { useState, useCallback } from 'react';

interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  exponentialBackoff?: boolean;
}

export function useRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): {
  execute: (...args: Parameters<T>) => Promise<ReturnType<T>>;
  retrying: boolean;
  retryCount: number;
} {
  const { maxRetries = 3, delay = 1000, exponentialBackoff = true } = options;
  const [retrying, setRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const execute = useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      let lastError: Error | null = null;
      let currentRetry = 0;

      while (currentRetry <= maxRetries) {
        try {
          setRetrying(currentRetry > 0);
          setRetryCount(currentRetry);
          const result = await fn(...args);
          setRetrying(false);
          setRetryCount(0);
          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          if (currentRetry < maxRetries) {
            const waitTime = exponentialBackoff
              ? delay * Math.pow(2, currentRetry)
              : delay;
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            currentRetry++;
          } else {
            setRetrying(false);
            setRetryCount(0);
            throw lastError;
          }
        }
      }

      setRetrying(false);
      setRetryCount(0);
      throw lastError || new Error('Retry failed');
    },
    [fn, maxRetries, delay, exponentialBackoff]
  );

  return { execute, retrying, retryCount };
}


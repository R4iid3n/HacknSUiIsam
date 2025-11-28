/**
 * API Cache Hook
 * Provides caching for API calls to reduce redundant requests
 */

import { useState, useEffect, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key?: string; // Cache key
}

const cache = new Map<string, CacheEntry<unknown>>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt < now) {
      cache.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function useApiCache<T>(
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const { ttl = 5 * 60 * 1000, key } = options; // Default 5 minutes
  const cacheKey = key || fetchFn.toString();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = async (useCache = true) => {
    // Check cache first
    if (useCache) {
      const cached = cache.get(cacheKey) as CacheEntry<T> | undefined;
      if (cached && cached.expiresAt > Date.now()) {
        setData(cached.data);
        setLoading(false);
        return;
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();

      // Store in cache
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      });

      setData(result);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [cacheKey]);

  const refetch = async () => {
    await fetchData(false);
  };

  return { data, loading, error, refetch };
}


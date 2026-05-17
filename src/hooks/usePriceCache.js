import { useCallback } from 'react';
import { cacheGet, cacheSet, cacheClear, cacheAge } from '../utils/cache.js';

export function usePriceCache() {
  const get = useCallback((key) => cacheGet(key), []);
  const set = useCallback((key, value, ttl) => cacheSet(key, value, ttl), []);
  const clear = useCallback((key) => cacheClear(key), []);
  const age = useCallback((key) => cacheAge(key), []);
  return { get, set, clear, age };
}

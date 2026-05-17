import { useState, useEffect } from 'react';
import { cacheGet, cacheSet } from '../utils/cache.js';

const CACHE_KEY = 'usd_cad_rate';
const FALLBACK   = 1.38;

export function useExchangeRate() {
  const [rate, setRate]       = useState(() => cacheGet(CACHE_KEY) ?? FALLBACK);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Use cached value if available (24h TTL set on write)
    if (cacheGet(CACHE_KEY)) return;

    setLoading(true);
    fetch('https://open.er-api.com/v6/latest/USD')
      .then((r) => r.json())
      .then((data) => {
        const cad = data?.rates?.CAD;
        if (cad && typeof cad === 'number') {
          setRate(cad);
          cacheSet(CACHE_KEY, cad, 24 * 60 * 60 * 1000);
        }
      })
      .catch(() => {/* keep fallback */})
      .finally(() => setLoading(false));
  }, []);

  return { rate, loading };
}

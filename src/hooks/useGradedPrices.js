import { useState, useEffect, useRef, useCallback } from 'react';
import { searchCard, getCard, extractPrices, pickBestMatch, clearQueue } from '../utils/priceLookupApi.js';
import { buildSearchQuery } from '../utils/cardMatcher.js';
import { cacheGet, cacheSet } from '../utils/cache.js';

export function useGradedPrices(cards, apiKey, enabled) {
  const [prices, setPrices]     = useState({});
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [fetching, setFetching] = useState(false);
  const abortRef = useRef(false);

  const fetchPrices = useCallback(async () => {
    if (!enabled || !apiKey || cards.length === 0) return;

    abortRef.current = false;
    setFetching(true);
    setProgress({ done: 0, total: cards.length });

    let done = 0;

    for (const card of cards) {
      if (abortRef.current) break;

      const cacheKey = `price_${card.id}`;
      const cached = cacheGet(cacheKey);
      if (cached) {
        done++;
        setPrices((p) => ({ ...p, [card.id]: cached }));
        setProgress({ done, total: cards.length });
        continue;
      }

      try {
        const query = buildSearchQuery(card.name, card.setId);
        const searchRes = await searchCard(query, apiKey);
        if (abortRef.current) break;

        const items = Array.isArray(searchRes)
          ? searchRes
          : searchRes?.data || searchRes?.results || searchRes?.cards || [];

        const match = pickBestMatch(items, card.name, card.setId);

        let extracted = match ? extractPrices(match) : null;

        // If we found a card but it has no graded data, try the individual endpoint
        if (extracted && extracted._tcgId && !extracted.psa9 && !extracted.psa10) {
          try {
            const detail = await getCard(extracted._tcgId, apiKey);
            if (abortRef.current) break;
            const detailed = extractPrices(detail?.data || detail);
            if (detailed?.psa9 || detailed?.psa10) {
              extracted = detailed;
            }
          } catch {
            // Individual fetch failed; keep what we have from search
          }
        }

        const val = extracted || 'not_found';
        cacheSet(cacheKey, val);
        setPrices((p) => ({ ...p, [card.id]: val }));
      } catch (err) {
        const val = err.message === 'INVALID_API_KEY' ? 'invalid_key' : 'error';
        setPrices((p) => ({ ...p, [card.id]: val }));

        if (err.message === 'INVALID_API_KEY') {
          clearQueue();
          break;
        }
      }

      done++;
      setProgress({ done, total: cards.length });
    }

    setFetching(false);
  }, [cards, apiKey, enabled]);

  useEffect(() => {
    setPrices({});
    setProgress({ done: 0, total: 0 });
    clearQueue();
    abortRef.current = true;

    if (enabled && apiKey && cards.length > 0) {
      const t = setTimeout(() => {
        abortRef.current = false;
        fetchPrices();
      }, 100);
      return () => {
        clearTimeout(t);
        abortRef.current = true;
        clearQueue();
      };
    }
  }, [cards, apiKey, enabled, fetchPrices]);

  const getPriceForCard = useCallback(
    (cardId) => {
      const p = prices[cardId];
      if (!p || p === 'error' || p === 'not_found' || p === 'invalid_key') return null;
      return p;
    },
    [prices]
  );

  return { prices, progress, fetching, getPriceForCard };
}

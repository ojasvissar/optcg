import { useState, useEffect, useCallback } from 'react';
import { fetchAllSets, fetchSetCards } from '../utils/optcgApi.js';
import { cacheGet, cacheSet, cacheClear } from '../utils/cache.js';
import { normalizeRarity } from '../utils/cardMatcher.js';

export function useCardData() {
  const [sets, setSets] = useState([]);
  const [setsLoading, setSetsLoading] = useState(true);
  const [selectedSet, setSelectedSet] = useState('');
  const [cards, setCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError] = useState(null);

  // Fetch set list on mount
  useEffect(() => {
    const cacheKey = 'sets_list';
    const cached = cacheGet(cacheKey);
    if (cached) {
      setSets(cached);
      setSetsLoading(false);
      return;
    }
    fetchAllSets()
      .then((data) => {
        const normalized = normalizeSetList(data);
        setSets(normalized);
        cacheSet(cacheKey, normalized, 7 * 24 * 60 * 60 * 1000); // 7 days
      })
      .catch(() => {})
      .finally(() => setSetsLoading(false));
  }, []);

  const loadSet = useCallback(async (setId) => {
    if (!setId) return;
    setSelectedSet(setId);
    setCardsError(null);
    setCardsLoading(true);
    setCards([]);

    const cacheKey = `cards_${setId}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      setCards(cached);
      setCardsLoading(false);
      return;
    }

    try {
      const raw = await fetchSetCards(setId);
      const normalized = normalizeCards(raw, setId);
      setCards(normalized);
      cacheSet(cacheKey, normalized);
    } catch (err) {
      setCardsError(err.message || 'Failed to load cards');
    } finally {
      setCardsLoading(false);
    }
  }, []);

  const clearSetCache = useCallback((setId) => {
    if (setId) {
      cacheClear(`cards_${setId}`);
    }
  }, []);

  return { sets, setsLoading, selectedSet, cards, cardsLoading, cardsError, loadSet, clearSetCache };
}

function normalizeSetList(data) {
  if (!Array.isArray(data)) return [];
  return data.map((s) => {
    if (typeof s === 'string') return { id: s, name: s };
    const id = s.set_id || s.id || s.setId || s.code || '';
    return {
      id,
      name: s.set_name || s.name || s.setName || id,
    };
  }).filter((s) => s.id);
}

function normalizeCards(data, setId) {
  if (!Array.isArray(data)) return [];
  return data
    .map((c) => {
      // card_set_id is the authoritative card ID (e.g. "OP01-077")
      const id = c.card_set_id || c.card_id || c.id || c.cardId || '';
      const marketPrice = parseFloat(c.market_price || c.marketPrice || 0) || 0;
      return {
        id,
        name:        c.card_name  || c.name       || c.cardName  || 'Unknown',
        type:        c.card_type  || c.type        || '',
        color:       c.card_color || c.color       || '',
        rarity:      normalizeRarity(c.rarity),
        setId:       c.set_id     || c.setId       || setId,
        setName:     c.set_name   || c.setName     || setId,
        text:        c.card_text  || c.text        || c.effect   || '',
        power:       c.card_power || c.power       || null,
        counter:     c.counter_amount != null ? c.counter_amount : (c.counter || null),
        cost:        c.card_cost  || c.cost        || null,
        marketPrice,
        invPrice:    parseFloat(c.inventory_price || c.invPrice || 0) || 0,
        imageId:     c.card_image_id || id,
      };
    })
    .filter((c) => c.id && c.marketPrice > 0);
}

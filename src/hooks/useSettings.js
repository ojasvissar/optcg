import { useState, useCallback } from 'react';

const DEFAULT_API_KEY = 'tcg_d16811193e9ca462ff86f6d7d45b25a104a186bdef07a25f';

const DEFAULTS = {
  apiKey:       DEFAULT_API_KEY,
  gradingCost:  60,
  minRawPrice:  0,
  psa9Mult:     1.5,
  psa10Mult:    2.5,
  sortBy:       'psa10roi',
  sortDir:      'desc',
  filterRarities: [],   // empty = show all
  filterColors:   [],   // empty = show all
  viewMode:     'grid', // 'grid' | 'table'
  watchlist:    [],     // array of card IDs
  bannerDismissed: false,
};

function loadSettings() {
  try {
    const raw = localStorage.getItem('optcg_settings');
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem('optcg_settings', JSON.stringify(settings));
  } catch {}
}

export function useSettings() {
  const [settings, setSettings] = useState(loadSettings);

  const update = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const toggleWatchlist = useCallback((cardId) => {
    setSettings((prev) => {
      const list = prev.watchlist || [];
      const next = list.includes(cardId)
        ? list.filter((id) => id !== cardId)
        : [...list, cardId];
      const s = { ...prev, watchlist: next };
      saveSettings(s);
      return s;
    });
  }, []);

  return { settings, update, toggleWatchlist };
}

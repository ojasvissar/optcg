const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

export function cacheGet(key) {
  try {
    const raw = localStorage.getItem(`optcg_cache_${key}`);
    if (!raw) return null;
    const { value, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) {
      localStorage.removeItem(`optcg_cache_${key}`);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export function cacheSet(key, value, ttl = DEFAULT_TTL) {
  try {
    localStorage.setItem(
      `optcg_cache_${key}`,
      JSON.stringify({ value, expiresAt: Date.now() + ttl, cachedAt: Date.now() })
    );
  } catch {
    // localStorage might be full — fail silently
  }
}

export function cacheClear(key) {
  try {
    if (key) {
      localStorage.removeItem(`optcg_cache_${key}`);
    } else {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('optcg_cache_'))
        .forEach((k) => localStorage.removeItem(k));
    }
  } catch {}
}

export function cacheAge(key) {
  try {
    const raw = localStorage.getItem(`optcg_cache_${key}`);
    if (!raw) return null;
    const { cachedAt } = JSON.parse(raw);
    return cachedAt ? Math.floor((Date.now() - cachedAt) / 1000 / 60) : null; // minutes ago
  } catch {
    return null;
  }
}

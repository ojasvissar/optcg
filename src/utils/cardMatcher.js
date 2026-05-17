// Normalize a card name for comparison
export function normalizeName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[.\-,'"()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function namesMatch(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return true;
  // partial containment
  if (na.length > 3 && nb.includes(na)) return true;
  if (nb.length > 3 && na.includes(nb)) return true;
  return false;
}

// Build a search query — strip parenthetical variants, keep the base name
export function buildSearchQuery(cardName, setId) {
  const cleaned = (cardName || '')
    .replace(/\([^)]*\)/g, '')  // remove (Parallel), (Manga Art), etc.
    .replace(/\[[^\]]*\]/g, '')  // remove [bracketed] content
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || cardName;
}

// Get a color stripe class from card color
export function colorStripeClass(color) {
  if (!color) return 'stripe-multi';
  const c = color.toLowerCase();
  if (c.includes('red'))    return 'stripe-red';
  if (c.includes('blue'))   return 'stripe-blue';
  if (c.includes('green'))  return 'stripe-green';
  if (c.includes('purple')) return 'stripe-purple';
  if (c.includes('black'))  return 'stripe-black';
  if (c.includes('yellow')) return 'stripe-yellow';
  return 'stripe-multi';
}

// Normalize rarity to a display key
export function normalizeRarity(rarity) {
  if (!rarity) return 'C';
  const r = rarity.toUpperCase().trim();
  if (r === 'COMMON'       || r === 'C')         return 'C';
  if (r === 'UNCOMMON'     || r === 'UC')        return 'UC';
  if (r === 'RARE'         || r === 'R')         return 'R';
  if (r === 'SUPER RARE'   || r === 'SR')        return 'SR';
  if (r === 'SECRET RARE'  || r === 'SEC')       return 'SEC';
  if (r === 'LEADER'       || r === 'L')         return 'L';
  if (r === 'SPECIAL'      || r === 'SP')        return 'SP';
  if (r === 'PROMO'        || r === 'P')         return 'SP';
  if (r.startsWith('SR'))  return 'SR';
  if (r.startsWith('SEC')) return 'SEC';
  return r;
}

export const RARITY_LABELS = {
  C:   'Common',
  UC:  'Uncommon',
  R:   'Rare',
  SR:  'Super Rare',
  SEC: 'Secret Rare',
  L:   'Leader',
  SP:  'Special',
};

export const RARITY_ORDER = { SEC: 0, L: 1, SR: 2, SP: 3, R: 4, UC: 5, C: 6 };

const BASE = '/optcg-api';
const IMG_BASE = 'https://optcgapi.com/media/static/Card_Images';

// cardId should be the card_image_id field (e.g. "OP01-077")
export function cardImageUrl(cardId) {
  if (!cardId) return '';
  return `${IMG_BASE}/${cardId}.jpg`;
}

async function apiFetch(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`OPTCG API error ${res.status}: ${path}`);
  return res.json();
}

export async function fetchAllSets() {
  try {
    const data = await apiFetch('/api/allSets/');
    // API returns array or object — normalize to array of { id, name }
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      return Object.entries(data).map(([id, name]) => ({ id, name }));
    }
    return [];
  } catch (err) {
    console.warn('fetchAllSets failed, using fallback list:', err.message);
    return FALLBACK_SETS;
  }
}

export async function fetchSetCards(setId) {
  const data = await apiFetch(`/api/sets/${setId}/`);
  // Normalize to array
  if (Array.isArray(data)) return data;
  if (data && data.cards) return data.cards;
  if (data && typeof data === 'object') return Object.values(data);
  return [];
}

export async function fetchCardDetail(cardId) {
  return apiFetch(`/api/sets/card/${cardId}/`);
}

export async function fetchCardPriceHistory(cardId) {
  try {
    return await apiFetch(`/api/sets/card/twoweeks/${cardId}/`);
  } catch {
    return null;
  }
}

// Hardcoded fallback set list (used if the API call fails)
// IDs match what the OPTCG API returns (hyphenated format)
export const FALLBACK_SETS = [
  { id: 'OP-01', name: 'Romance Dawn' },
  { id: 'OP-02', name: 'Paramount War' },
  { id: 'OP-03', name: 'Pillars of Strength' },
  { id: 'OP-04', name: 'Kingdoms of Intrigue' },
  { id: 'OP-05', name: 'Awakening of the New Era' },
  { id: 'OP-06', name: 'Wings of the Captain' },
  { id: 'OP-07', name: '500 Years in the Future' },
  { id: 'OP-08', name: 'Two Legends' },
  { id: 'OP-09', name: 'The Four Emperors' },
  { id: 'OP-10', name: 'Royal Blood' },
  { id: 'EB-01', name: 'Memorial Collection' },
  { id: 'EB-02', name: 'Egghead' },
  { id: 'PRB-01', name: 'Premium Booster' },
  { id: 'ST-01', name: 'Starter Deck — Straw Hat Crew' },
  { id: 'ST-02', name: 'Starter Deck — Worst Generation' },
  { id: 'ST-03', name: 'Starter Deck — The Seven Warlords' },
  { id: 'ST-04', name: 'Starter Deck — Animal Kingdom Pirates' },
  { id: 'ST-05', name: 'Starter Deck — Film Edition' },
  { id: 'ST-06', name: 'Starter Deck — Absolute Justice' },
  { id: 'ST-07', name: 'Starter Deck — Big Mom Pirates' },
  { id: 'ST-08', name: 'Starter Deck — Monkey.D.Luffy' },
  { id: 'ST-09', name: 'Starter Deck — Yamato' },
  { id: 'ST-10', name: 'Starter Deck — UTA' },
];

// Use Vite proxy in dev; call directly in production (API has CORS: *)
const BASE = import.meta.env.DEV ? '/tcg-price-api/v1' : 'https://api.tcgpricelookup.com/v1';

let queue = [];
let processing = false;
const RATE_DELAY = 1100; // 1.1s between requests

function processQueue() {
  if (processing || queue.length === 0) return;
  processing = true;

  const { fn, resolve, reject } = queue.shift();
  fn()
    .then(resolve)
    .catch(reject)
    .finally(() => {
      processing = false;
      setTimeout(processQueue, RATE_DELAY);
    });
}

function enqueue(fn) {
  return new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    processQueue();
  });
}

export function clearQueue() {
  queue = [];
  processing = false;
}

async function apiFetch(path, apiKey) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'X-API-Key': apiKey },
  });
  if (res.status === 401 || res.status === 403) throw new Error('INVALID_API_KEY');
  if (res.status === 429) throw new Error('RATE_LIMITED');
  if (!res.ok) throw new Error(`TCG API error ${res.status}`);
  return res.json();
}

// Search returns { data: [...cards] }; each card has prices.raw.near_mint.tcgplayer
export async function searchCard(cardName, apiKey) {
  const query = encodeURIComponent(cardName);
  // game=onepiece filters to One Piece TCG results
  return enqueue(() => apiFetch(`/cards/search?q=${query}&game=onepiece`, apiKey));
}

// Fetch a single card by its TCG Price Lookup UUID for full price data including graded
export async function getCard(cardId, apiKey) {
  return enqueue(() => apiFetch(`/cards/${cardId}`, apiKey));
}

// Extract prices from a card object returned by the search or single-card endpoint.
// The TCG Price Lookup API returns prices nested under card.prices
export function extractPrices(cardData) {
  if (!cardData) return null;
  const p = cardData.prices || {};
  return {
    rawTcgMarket: p?.raw?.near_mint?.tcgplayer?.market    ?? null,
    rawEbay7d:    p?.raw?.near_mint?.ebay?.avg_7d          ?? null,
    psa9:         p?.graded?.psa?.['9']                    ?? null,
    psa10:        p?.graded?.psa?.['10']                   ?? null,
    bgs95:        p?.graded?.bgs?.['9.5']                  ?? null,
    cgc10:        p?.graded?.cgc?.['10']                   ?? null,
    // Keep the card ID so we can deep-fetch for graded data
    _tcgId:       cardData.id                              ?? null,
  };
}

export function pickBestMatch(results, cardName, setId) {
  if (!results || results.length === 0) return null;
  if (results.length === 1) return results[0];

  // Normalize the OPTCG card ID to the format TCG Price Lookup uses
  // OPTCG: "OP01-120" → TCG Price Lookup number: "OP01-120" (same format)
  const cardIdNorm = (setId || '').replace('-', '') + '-';

  const nameLower = cardName.toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^\w\s]/g, '').trim();
  const setLower  = (setId || '').toLowerCase().replace('-', '');

  let best = results[0];
  let bestScore = -1;

  for (const r of results) {
    let score = 0;
    const rName   = (r.name   || '').toLowerCase().replace(/[^\w\s]/g, '').trim();
    const rNumber = (r.number || '').replace('-', '').toLowerCase();
    const rSet    = (r.set?.slug || r.set?.name || r.set_name || '').toLowerCase();

    // Exact card number match is the strongest signal
    // e.g. OPTCG card "OP01-120" → rNumber "op01120", setLower has "op01"
    if (rNumber.startsWith(setLower) || rNumber.startsWith(cardIdNorm.toLowerCase().replace('-', ''))) {
      score += 15;
    }

    // Name similarity
    if (rName === nameLower) score += 10;
    else if (nameLower.length > 3 && (rName.includes(nameLower) || nameLower.includes(rName))) score += 5;

    // Set match via slug
    if (rSet.includes(setLower) || setLower.includes(rSet.replace(/[^a-z0-9]/g, ''))) score += 4;

    // Prefer entries with graded price data
    const graded = r.prices?.graded?.psa;
    if (graded?.['10'] || graded?.['9']) score += 3;

    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }
  return best;
}

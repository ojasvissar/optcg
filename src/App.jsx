import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSettings } from './hooks/useSettings.js';
import { useCardData } from './hooks/useCardData.js';
import { useGradedPrices } from './hooks/useGradedPrices.js';
import { useExchangeRate } from './hooks/useExchangeRate.js';
import { cacheAge as getCacheAge, cacheClear } from './utils/cache.js';
import { calcROI, calcEstimatedPrices } from './utils/calculateROI.js';
import { RARITY_ORDER } from './utils/cardMatcher.js';
import Header from './components/Header.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import SummaryStats from './components/SummaryStats.jsx';
import CardGrid from './components/CardGrid.jsx';
import CardTable from './components/CardTable.jsx';
import CardDetailModal from './components/CardDetailModal.jsx';
import LoadingSkeleton from './components/LoadingSkeleton.jsx';
import PriceProgressBar from './components/PriceProgressBar.jsx';
import FallbackBanner from './components/FallbackBanner.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import { ToastProvider, useAddToast } from './components/Toast.jsx';

function AppInner() {
  const { settings, update, toggleWatchlist } = useSettings();
  const { sets, setsLoading, selectedSet, cards, cardsLoading, cardsError, loadSet } = useCardData();
  const [selectedCard, setSelectedCard] = useState(null);
  const [activeTab, setActiveTab] = useState('cards'); // 'cards' | 'watchlist'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const addToast = useAddToast();

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const hasApiKey = !!(settings.apiKey && settings.apiKey.trim());
  const { rate: usdToCad, loading: rateLoading } = useExchangeRate();

  // Fetch graded prices from TCG Price Lookup
  const { prices, progress, fetching, getPriceForCard } = useGradedPrices(
    cards,
    settings.apiKey,
    hasApiKey
  );

  // Enrich cards with pricing and ROI data (all displayed prices in CAD)
  const enrichedCards = useMemo(() => {
    const fx = usdToCad; // USD → CAD multiplier

    return cards.map((card) => {
      const gradedData = hasApiKey ? getPriceForCard(card.id) : null;

      // Raw price: prefer TCG live data, fall back to OPTCG — both USD, convert to CAD
      const rawUsd = gradedData?.rawTcgMarket || gradedData?.rawEbay7d || card.marketPrice || 0;
      const rawPrice = rawUsd * fx;

      let psa9Price, psa10Price, priceSource;
      const hasLiveRaw = hasApiKey && gradedData && (gradedData.rawTcgMarket || gradedData.rawEbay7d);

      if (hasApiKey && gradedData && (gradedData.psa9 || gradedData.psa10)) {
        // Real graded prices from TCG Price Lookup (USD) → CAD
        psa9Price   = gradedData.psa9  != null ? gradedData.psa9  * fx : null;
        psa10Price  = gradedData.psa10 != null ? gradedData.psa10 * fx : null;
        priceSource = 'live';
      } else {
        // Estimated graded prices using multipliers (applied after CAD conversion)
        const est = calcEstimatedPrices(rawPrice, settings.psa9Mult, settings.psa10Mult);
        psa9Price   = est.psa9;
        psa10Price  = est.psa10;
        priceSource = hasLiveRaw ? 'live' : 'est';
      }

      // Grading cost is entered by user in CAD — no conversion needed
      const roi9  = calcROI(psa9Price,  rawPrice, settings.gradingCost);
      const roi10 = calcROI(psa10Price, rawPrice, settings.gradingCost);

      return {
        ...card,
        rawPrice,
        psa9Price,
        psa10Price,
        psa9Roi:     roi9?.roi     ?? null,
        psa10Roi:    roi10?.roi    ?? null,
        psa9Profit:  roi9?.profit  ?? null,
        psa10Profit: roi10?.profit ?? null,
        priceSource,
        gradedData,
        fx,
      };
    });
  }, [cards, getPriceForCard, hasApiKey, settings.gradingCost, settings.psa9Mult, settings.psa10Mult, usdToCad]);

  // Filter
  const filteredCards = useMemo(() => {
    let result = enrichedCards;

    if (result.length === 0) return result;

    // Min raw price
    if (settings.minRawPrice > 0) {
      result = result.filter((c) => c.rawPrice >= settings.minRawPrice);
    }

    // Rarity filter (empty = show all)
    if (settings.filterRarities && settings.filterRarities.length > 0) {
      result = result.filter((c) => settings.filterRarities.includes(c.rarity));
    }

    return result;
  }, [enrichedCards, settings.minRawPrice, settings.filterRarities]);

  // Sort — dir=1 means "desc" (larger values first), dir=-1 means "asc"
  const sortedCards = useMemo(() => {
    const dir = settings.sortDir === 'desc' ? 1 : -1;

    // dir=1 (desc): want larger values first → b-a gives positive when b>a → b before a ✓
    // dir=-1 (asc): want smaller values first → -(b-a) = a-b gives negative when a<b → a before b ✓
    return [...filteredCards].sort((a, b) => {
      switch (settings.sortBy) {
        case 'rawPrice':    return dir * ((b.rawPrice    || 0)     - (a.rawPrice    || 0));
        case 'psa9Roi':     return dir * ((b.psa9Roi     ?? -9999) - (a.psa9Roi     ?? -9999));
        case 'psa10Roi':    return dir * ((b.psa10Roi    ?? -9999) - (a.psa10Roi    ?? -9999));
        case 'psa9Profit':  return dir * ((b.psa9Profit  ?? -9999) - (a.psa9Profit  ?? -9999));
        case 'psa10Profit': return dir * ((b.psa10Profit ?? -9999) - (a.psa10Profit ?? -9999));
        // Lower RARITY_ORDER = rarer; desc = rarest first = smallest order first
        case 'rarity':      return dir * ((RARITY_ORDER[a.rarity] ?? 9) - (RARITY_ORDER[b.rarity] ?? 9));
        // name desc = Z→A, asc = A→Z
        case 'name':        return dir * b.name.localeCompare(a.name);
        default:            return dir * ((b.psa10Roi    ?? -9999) - (a.psa10Roi    ?? -9999));
      }
    });
  }, [filteredCards, settings.sortBy, settings.sortDir]);

  // Watchlist cards
  const watchlistCards = useMemo(() => {
    const ids = new Set(settings.watchlist || []);
    return enrichedCards.filter((c) => ids.has(c.id));
  }, [enrichedCards, settings.watchlist]);

  const displayCards = activeTab === 'watchlist' ? watchlistCards : sortedCards;

  const handleSelectSet = useCallback((setId) => {
    loadSet(setId);
    setActiveTab('cards');
  }, [loadSet]);

  const handleRefreshSet = useCallback((setId) => {
    cacheClear(`cards_${setId}`);
    // Also clear all price caches for this set
    const keysToDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('optcg_cache_price_')) keysToDelete.push(k);
    }
    keysToDelete.forEach((k) => localStorage.removeItem(k));
    loadSet(setId);
    addToast?.('Prices refreshed!', 'success');
  }, [loadSet, addToast]);

  const handleCardClick = useCallback((card) => {
    setSelectedCard(card);
  }, []);

  const closeModal = useCallback(() => setSelectedCard(null), []);

  const toggleSortDir = useCallback(() => {
    update({ sortDir: settings.sortDir === 'asc' ? 'desc' : 'asc' });
  }, [update, settings.sortDir]);

  const cacheAgeMin = selectedSet ? getCacheAge(`cards_${selectedSet}`) : null;

  // Invalid API key detection
  useEffect(() => {
    const anyInvalid = Object.values(prices).includes('invalid_key');
    if (anyInvalid && addToast) {
      addToast('Invalid API key — check Settings', 'error', 5000);
    }
  }, [prices, addToast]);

  return (
    <div className="app-shell">
      <Header
        sets={sets}
        setsLoading={setsLoading}
        selectedSet={selectedSet}
        onSelectSet={handleSelectSet}
        viewMode={settings.viewMode}
        onViewMode={(v) => update({ viewMode: v })}
        isMobile={isMobile}
        onToggleSidebar={() => setMobileSidebarOpen((v) => !v)}
      />

      <div className="main-layout">
        {/* Sidebar */}
        <aside className={`sidebar${mobileSidebarOpen ? ' mobile-open' : ''}`}>
          <SettingsPanel
            settings={settings}
            onUpdate={update}
            onRefreshSet={handleRefreshSet}
            selectedSet={selectedSet}
            cacheAge={cacheAgeMin}
          />
        </aside>

        {/* Content */}
        <main className="content-area">
          {/* Fallback banner */}
          {!hasApiKey && !settings.bannerDismissed && selectedSet && (
            <FallbackBanner onDismiss={() => update({ bannerDismissed: true })} />
          )}

          {/* Exchange rate chip */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <div style={{
              fontFamily: 'Space Mono, monospace', fontSize: 10,
              color: 'var(--txt3)', background: 'var(--bg2)',
              border: '1px solid var(--border)', borderRadius: 4,
              padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ color: rateLoading ? 'var(--amber2)' : 'var(--positive)', fontSize: 8 }}>●</span>
              {rateLoading ? 'Fetching rate…' : `1 USD = CA$${usdToCad.toFixed(4)} · All prices in CAD`}
            </div>
          </div>

          {/* Summary stats */}
          {!cardsLoading && cards.length > 0 && (
            <SummaryStats cards={cards} enriched={enrichedCards} />
          )}

          {/* Progress bar */}
          {hasApiKey && fetching && (
            <PriceProgressBar done={progress.done} total={progress.total} />
          )}

          {/* Tabs */}
          {cards.length > 0 && (
            <div className="tab-bar">
              <button
                className={`tab-btn${activeTab === 'cards' ? ' active' : ''}`}
                onClick={() => setActiveTab('cards')}
              >
                Cards ({sortedCards.length})
              </button>
              <button
                className={`tab-btn${activeTab === 'watchlist' ? ' active' : ''}`}
                onClick={() => setActiveTab('watchlist')}
              >
                ★ Watchlist ({watchlistCards.length})
              </button>
            </div>
          )}

          {/* Sort + filter bar — always visible once a set is loaded */}
          {cards.length > 0 && !cardsLoading && (
            <div className="controls-bar">
              <select
                className="sort-select"
                value={settings.sortBy}
                onChange={(e) => update({ sortBy: e.target.value })}
              >
                <option value="psa10Roi">Sort: PSA 10 ROI</option>
                <option value="psa9Roi">Sort: PSA 9 ROI</option>
                <option value="psa10Profit">Sort: PSA 10 Profit</option>
                <option value="psa9Profit">Sort: PSA 9 Profit</option>
                <option value="rawPrice">Sort: Raw Price</option>
                <option value="rarity">Sort: Rarity</option>
                <option value="name">Sort: Name A–Z</option>
              </select>

              <button
                className="btn btn-ghost btn-icon"
                onClick={toggleSortDir}
                title={`Sort ${settings.sortDir === 'desc' ? 'ascending' : 'descending'}`}
              >
                {settings.sortDir === 'desc' ? '↓' : '↑'}
              </button>

              <span className="result-count">
                {displayCards.length !== cards.length
                  ? `${displayCards.length} / ${cards.length} cards`
                  : `${cards.length} cards`}
              </span>

              {/* Quick clear filter button when results are filtered */}
              {(settings.filterRarities?.length > 0 || settings.minRawPrice > 0) && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => update({ filterRarities: [], minRawPrice: 0 })}
                  style={{ color: 'var(--txt3)', marginLeft: 4 }}
                  title="Clear all filters"
                >
                  ✕ Clear filters
                </button>
              )}
            </div>
          )}

          {/* Card loading state */}
          {cardsLoading && <LoadingSkeleton count={12} />}

          {/* Error state */}
          {cardsError && (
            <div className="empty-state">
              <div className="empty-icon">⚠</div>
              <div className="empty-title">Failed to load cards</div>
              <div className="empty-sub">{cardsError}</div>
              <button className="btn btn-primary empty-action" onClick={() => handleSelectSet(selectedSet)}>
                Retry
              </button>
            </div>
          )}

          {/* Empty state — no set selected */}
          {!selectedSet && !cardsLoading && (
            <div className="empty-state">
              <div className="empty-icon">⚓</div>
              <div className="empty-title">Select a Set to Get Started</div>
              <div className="empty-sub">
                Choose a One Piece TCG set from the dropdown above to see which cards are worth grading.
              </div>
            </div>
          )}

          {/* Empty state — set selected, no cards after filter */}
          {selectedSet && !cardsLoading && !cardsError && cards.length > 0 && displayCards.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <div className="empty-title">No cards match your filters</div>
              <div className="empty-sub">Try adjusting the rarity filter or minimum price slider.</div>
            </div>
          )}

          {/* Watchlist empty */}
          {activeTab === 'watchlist' && watchlistCards.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">☆</div>
              <div className="empty-title">Your watchlist is empty</div>
              <div className="empty-sub">Star cards to track them here.</div>
            </div>
          )}

          {/* Cards display */}
          {!cardsLoading && displayCards.length > 0 && (
            settings.viewMode === 'grid' ? (
              <CardGrid
                cards={displayCards}
                onCardClick={handleCardClick}
                watchlist={settings.watchlist}
                onToggleWatch={toggleWatchlist}
              />
            ) : (
              <CardTable
                cards={displayCards}
                onCardClick={handleCardClick}
                watchlist={settings.watchlist}
                onToggleWatch={toggleWatchlist}
                sortBy={settings.sortBy}
                sortDir={settings.sortDir}
                onSort={(col) => {
                  if (col === settings.sortBy) {
                    update({ sortDir: settings.sortDir === 'desc' ? 'asc' : 'desc' });
                  } else {
                    update({ sortBy: col, sortDir: 'desc' });
                  }
                }}
              />
            )
          )}
        </main>
      </div>

      {/* Card detail modal */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          gradedData={selectedCard.gradedData}
          gradedPrices={selectedCard.gradedData}
          gradingCost={settings.gradingCost}
          onClose={closeModal}
        />
      )}

      <ScrollToTop />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}

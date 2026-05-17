import { useState, useCallback, useRef } from 'react';
import { cacheClear } from '../utils/cache.js';
import { RARITY_LABELS } from '../utils/cardMatcher.js';

const RARITIES = Object.entries(RARITY_LABELS);

export default function SettingsPanel({ settings, onUpdate, onRefreshSet, selectedSet, cacheAge }) {
  const [showKey, setShowKey] = useState(false);
  const hasKey = !!(settings.apiKey && settings.apiKey.trim());

  // Stable debounce using a ref so the timer persists across renders
  const timerRef = useRef(null);
  const debouncedUpdate = useCallback((patch) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onUpdate(patch), 150);
  }, [onUpdate]);

  const handleRarityToggle = (rarity) => {
    const cur = settings.filterRarities || [];
    const next = cur.includes(rarity)
      ? cur.filter((r) => r !== rarity)
      : [...cur, rarity];
    onUpdate({ filterRarities: next });
  };

  const clearRarityFilter = () => onUpdate({ filterRarities: [] });

  const handleRefresh = () => {
    if (selectedSet) {
      onRefreshSet(selectedSet);
    }
  };

  const activeRarities = settings.filterRarities || [];

  return (
    <>
      {/* API Key */}
      <div className="settings-section">
        <div className="settings-section-title">API Key</div>
        <div className="setting-row">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'Space Mono, monospace', fontSize: 10,
            padding: '4px 8px', borderRadius: 4, border: '1px solid',
            marginBottom: 8,
            color: hasKey ? 'var(--positive)' : 'var(--txt3)',
            background: hasKey ? 'rgba(29,158,117,.1)' : 'var(--bg)',
            borderColor: hasKey ? 'rgba(29,158,117,.3)' : 'var(--border)',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              background: hasKey ? 'var(--positive)' : 'var(--txt3)',
              boxShadow: hasKey ? '0 0 4px var(--positive)' : 'none',
            }} />
            {hasKey ? 'Connected ✓' : 'Not connected'}
          </div>

          <div style={{ position: 'relative' }}>
            <input
              className="setting-input"
              type={showKey ? 'text' : 'password'}
              value={settings.apiKey || ''}
              onChange={(e) => onUpdate({ apiKey: e.target.value })}
              placeholder="Paste TCG Price Lookup key…"
              style={{ paddingRight: 36 }}
            />
            <button
              onClick={() => setShowKey((v) => !v)}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--txt3)', fontSize: 13,
              }}
            >
              {showKey ? '🙈' : '👁'}
            </button>
          </div>

          <a
            href="https://tcgpricelookup.com/pricing"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 10, fontFamily: 'Space Mono, monospace', color: 'var(--amber2)',
                     textDecoration: 'underline', textUnderlineOffset: 2 }}
          >
            Get API key ($14.99/mo) →
          </a>
        </div>
      </div>

      {/* Grading Settings */}
      <div className="settings-section">
        <div className="settings-section-title">Grading</div>

        <div className="setting-row">
          <label className="setting-label">
            Grading Cost
            <span className="setting-label-val">${settings.gradingCost}</span>
          </label>
          <input
            className="setting-input"
            type="number"
            min="0"
            max="500"
            value={settings.gradingCost}
            onChange={(e) => onUpdate({ gradingCost: parseFloat(e.target.value) || 0 })}
          />
        </div>

        <div className="setting-row">
          <label className="setting-label">
            Min Raw Price
            <span className="setting-label-val">${settings.minRawPrice}</span>
          </label>
          <input
            className="setting-range"
            type="range"
            min="0"
            max="500"
            step="5"
            value={settings.minRawPrice}
            onChange={(e) => {
              // Update display label immediately via onUpdate (fast), debounce the filter
              const val = parseFloat(e.target.value);
              onUpdate({ minRawPrice: val });
            }}
          />
        </div>

        {/* Always show multiplier sliders — used even when API key is set (for estimated graded ROI) */}
        <div className="setting-row">
          <label className="setting-label">
            PSA 9 Est. Mult.
            <span className="setting-label-val">{Number(settings.psa9Mult).toFixed(1)}×</span>
          </label>
          <input
            className="setting-range"
            type="range"
            min="1"
            max="5"
            step="0.1"
            value={settings.psa9Mult}
            onChange={(e) => onUpdate({ psa9Mult: parseFloat(e.target.value) })}
          />
        </div>

        <div className="setting-row">
          <label className="setting-label">
            PSA 10 Est. Mult.
            <span className="setting-label-val">{Number(settings.psa10Mult).toFixed(1)}×</span>
          </label>
          <input
            className="setting-range"
            type="range"
            min="1"
            max="10"
            step="0.1"
            value={settings.psa10Mult}
            onChange={(e) => onUpdate({ psa10Mult: parseFloat(e.target.value) })}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="settings-section">
        <div className="settings-section-title">Filter by Rarity</div>
        <div style={{ fontSize: 10, fontFamily: 'Space Mono, monospace', color: 'var(--txt3)', marginBottom: 8 }}>
          {activeRarities.length === 0 ? 'Showing all rarities' : `Showing: ${activeRarities.join(', ')}`}
        </div>
        <div className="filter-checkboxes">
          {RARITIES.map(([key, label]) => (
            <label key={key} className="filter-check">
              <input
                type="checkbox"
                checked={activeRarities.includes(key)}
                onChange={() => handleRarityToggle(key)}
              />
              <span className={`rarity-badge rarity-${key}`}>{label}</span>
            </label>
          ))}
        </div>
        {activeRarities.length > 0 && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={clearRarityFilter}
            style={{ marginTop: 8, width: '100%', color: 'var(--txt3)' }}
          >
            ✕ Clear filter — show all
          </button>
        )}
      </div>

      {/* Cache Controls */}
      {selectedSet && (
        <div className="settings-section">
          <div className="settings-section-title">Cache</div>
          <div style={{ fontSize: 11, fontFamily: 'Space Mono, monospace', color: 'var(--txt3)', marginBottom: 8 }}>
            {cacheAge !== null ? `Updated ${cacheAge}m ago` : 'Not cached yet'}
          </div>
          <button className="btn btn-amber btn-sm" onClick={handleRefresh} style={{ width: '100%' }}>
            ↺ Refresh Prices
          </button>
        </div>
      )}
    </>
  );
}

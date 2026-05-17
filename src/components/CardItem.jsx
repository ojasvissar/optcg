import { useState } from 'react';
import { cardImageUrl } from '../utils/optcgApi.js';
import { fmt } from '../utils/formatCurrency.js';
import { formatROI, formatProfit } from '../utils/calculateROI.js';
import { colorStripeClass, RARITY_LABELS } from '../utils/cardMatcher.js';

export default function CardItem({ card, psa9Roi, psa10Roi, psa9Profit, psa10Profit,
  rawPrice, psa9Price, psa10Price, priceSource, isWatched, onToggleWatch, onClick }) {

  const [imgError, setImgError] = useState(false);
  const isGradeWorthy = psa10Roi !== null && psa10Roi >= 50;
  const isNegative    = psa10Roi !== null && psa10Roi < 0;

  const roiClass9  = psa9Roi  === null ? 'neutral' : psa9Roi  >= 0 ? 'positive' : 'negative';
  const roiClass10 = psa10Roi === null ? 'neutral' : psa10Roi >= 0 ? 'positive' : 'negative';

  return (
    <div
      className={`card-item${isNegative ? ' negative-roi' : ''}${isGradeWorthy ? ' grade-worthy' : ''}`}
      onClick={onClick}
    >
      <div className={`card-color-stripe ${colorStripeClass(card.color)}`} />

      <div className="card-img-wrap">
        {!imgError ? (
          <img
            src={cardImageUrl(card.imageId || card.id)}
            alt={card.name}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="card-img-placeholder">🃏</div>
        )}

        {isGradeWorthy && (
          <div className="grade-worthy-badge">GRADE THIS</div>
        )}

        <div className={`price-source-badge badge-${priceSource}`}>
          {priceSource === 'live' ? 'LIVE' : 'EST'}
        </div>
      </div>

      <div className="card-body">
        <div className="card-meta">
          <div>
            <div className="card-name">{card.name}</div>
            <div className="card-id">{card.id}</div>
          </div>
          <button
            className={`star-btn${isWatched ? ' starred' : ''}`}
            onClick={(e) => { e.stopPropagation(); onToggleWatch(card.id); }}
            title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            {isWatched ? '★' : '☆'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className={`rarity-badge rarity-${card.rarity}`}>
            {RARITY_LABELS[card.rarity] || card.rarity}
          </span>
          {card.color && (
            <span style={{ fontSize: 10, color: 'var(--txt3)', fontFamily: 'Space Mono, monospace' }}>
              {card.color}
            </span>
          )}
        </div>

        <div className="card-prices">
          <div className="price-cell">
            <div className="price-cell-label">Raw</div>
            <div className={`price-cell-value${!rawPrice ? ' na' : ''}`}>
              {rawPrice ? fmt(rawPrice) : '—'}
            </div>
          </div>
          <div className="price-cell">
            <div className="price-cell-label">PSA 10</div>
            <div className={`price-cell-value${!psa10Price ? ' na' : ''}`}>
              {psa10Price ? fmt(psa10Price) : '—'}
            </div>
          </div>
          <div className="price-cell">
            <div className="price-cell-label">PSA 9</div>
            <div className={`price-cell-value${!psa9Price ? ' na' : ''}`}>
              {psa9Price ? fmt(psa9Price) : '—'}
            </div>
          </div>
          <div className="price-cell">
            <div className="price-cell-label">PSA 9 Profit</div>
            <div className={`price-cell-value${psa9Profit === null ? ' na' : ''}`}
              style={psa9Profit !== null ? { color: psa9Profit >= 0 ? 'var(--positive)' : 'var(--negative)' } : {}}>
              {psa9Profit !== null ? formatProfit(psa9Profit) : '—'}
            </div>
          </div>
        </div>

        <div className="roi-row">
          <div className={`roi-chip ${roiClass9}`}>
            <div className="roi-label">PSA 9 ROI</div>
            <div className="roi-value">{formatROI(psa9Roi)}</div>
          </div>
          <div className={`roi-chip ${roiClass10}`}>
            <div className="roi-label">PSA 10 ROI</div>
            <div className="roi-value">{formatROI(psa10Roi)}</div>
          </div>
        </div>

        {psa10Profit !== null && (
          <div className="profit-row">
            <div className="profit-item">
              PSA 10 profit: <span style={{ color: psa10Profit >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                {formatProfit(psa10Profit)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

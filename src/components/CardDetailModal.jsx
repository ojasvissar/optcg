import { useEffect, useState } from 'react';
import { cardImageUrl } from '../utils/optcgApi.js';
import { fmt } from '../utils/formatCurrency.js';
import { formatROI, formatProfit, calcROI } from '../utils/calculateROI.js';
import { RARITY_LABELS, colorStripeClass } from '../utils/cardMatcher.js';
import PriceTrendChart from './PriceTrendChart.jsx';

export default function CardDetailModal({ card, gradedPrices, gradingCost, onClose }) {
  const [imgError, setImgError] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!card) return null;

  const rawPrice  = gradedPrices?.rawTcgMarket || gradedPrices?.rawEbay7d || card.marketPrice || 0;
  const psa9      = gradedPrices?.psa9  ?? null;
  const psa10     = gradedPrices?.psa10 ?? null;
  const bgs95     = gradedPrices?.bgs95 ?? null;
  const cgc10     = gradedPrices?.cgc10 ?? null;

  const roi9  = calcROI(psa9,  rawPrice, gradingCost);
  const roi10 = calcROI(psa10, rawPrice, gradingCost);

  const searchQ = encodeURIComponent(`${card.name} ${card.id}`);
  const priceChartingUrl = `https://www.pricecharting.com/search-products?q=${searchQ}&type=prices`;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {/* Header */}
        <div className="modal-header">
          <div className={`card-color-stripe ${colorStripeClass(card.color)}`}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3 }} />

          {!imgError ? (
            <img
              className="modal-img"
              src={cardImageUrl(card.imageId || card.id)}
              alt={card.name}
              onError={() => setImgError(true)}
            />
          ) : (
            <div style={{ width: 100, height: 139, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 40, background: 'var(--bg2)',
              borderRadius: 8, border: '2px solid var(--border2)' }}>🃏</div>
          )}

          <div className="modal-title-area">
            <div className="modal-title">{card.name}</div>
            <div className="modal-subtitle">
              <span>{card.id}</span>
              <span className={`rarity-badge rarity-${card.rarity}`}>
                {RARITY_LABELS[card.rarity] || card.rarity}
              </span>
              {card.color && <span>{card.color}</span>}
              {card.type  && <span>{card.type}</span>}
            </div>

            {/* Quick stats */}
            <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
              {card.cost    && <StatPill label="Cost"    value={card.cost} />}
              {card.power   && <StatPill label="Power"   value={card.power} />}
              {card.counter && <StatPill label="Counter" value={card.counter} />}
            </div>
          </div>

          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Left column */}
          <div>
            <div className="modal-section-title">Price Breakdown</div>
            <table className="price-table">
              <tbody>
                <tr><td>Raw (TCGPlayer)</td>
                  <td>{fmt(gradedPrices?.rawTcgMarket)}</td></tr>
                <tr><td>Raw (eBay 7d avg)</td>
                  <td>{fmt(gradedPrices?.rawEbay7d)}</td></tr>
                <tr><td>PSA 9</td>
                  <td className={psa9 ? 'positive-val' : 'na-val'}>{fmt(psa9)}</td></tr>
                <tr><td>PSA 10</td>
                  <td className={psa10 ? 'positive-val' : 'na-val'}>{fmt(psa10)}</td></tr>
                <tr><td>BGS 9.5</td>
                  <td className={bgs95 ? 'positive-val' : 'na-val'}>{fmt(bgs95)}</td></tr>
                <tr><td>CGC 10</td>
                  <td className={cgc10 ? 'positive-val' : 'na-val'}>{fmt(cgc10)}</td></tr>
              </tbody>
            </table>

            <div style={{ marginTop: 16 }}>
              <div className="modal-section-title">2-Week Price Trend</div>
              <PriceTrendChart cardId={card.id} />
            </div>
          </div>

          {/* Right column */}
          <div>
            <div className="modal-section-title">ROI Breakdown (Grading: ${gradingCost})</div>

            {/* PSA 10 breakdown */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'var(--txt3)',
                marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>PSA 10</div>
              <RoiBreakdown
                gradedPrice={psa10}
                rawPrice={rawPrice}
                gradingCost={gradingCost}
                roi={roi10}
              />
            </div>

            {/* PSA 9 breakdown */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'var(--txt3)',
                marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>PSA 9</div>
              <RoiBreakdown
                gradedPrice={psa9}
                rawPrice={rawPrice}
                gradingCost={gradingCost}
                roi={roi9}
              />
            </div>

            {/* Card text */}
            {card.text && (
              <>
                <div className="modal-section-title">Card Text</div>
                <div className="card-text-block">{card.text}</div>
              </>
            )}

            <div className="modal-links" style={{ marginTop: 16 }}>
              <a className="modal-link" href={priceChartingUrl} target="_blank" rel="noopener noreferrer">
                ↗ PriceCharting
              </a>
              <a className="modal-link"
                href={`https://www.tcgplayer.com/search/one-piece-card-game/product?q=${encodeURIComponent(card.name)}`}
                target="_blank" rel="noopener noreferrer">
                ↗ TCGPlayer
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10 }}>
      <span style={{ color: 'var(--txt3)', marginRight: 4 }}>{label}:</span>
      <span style={{ color: 'var(--txt)', fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function RoiBreakdown({ gradedPrice, rawPrice, gradingCost, roi }) {
  if (!gradedPrice) {
    return (
      <div className="roi-breakdown">
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'var(--txt3)', textAlign: 'center', padding: '8px 0' }}>
          No graded price data
        </div>
      </div>
    );
  }

  const profit = roi?.profit ?? null;
  const roiPct = roi?.roi   ?? null;
  const isPos  = profit !== null && profit >= 0;

  return (
    <div className="roi-breakdown">
      <div className="roi-breakdown-row">
        <span>Graded Price</span>
        <span>{fmt(gradedPrice)}</span>
      </div>
      <div className="roi-breakdown-row">
        <span>− Raw Price</span>
        <span style={{ color: 'var(--negative)' }}>−{fmt(rawPrice)}</span>
      </div>
      <div className="roi-breakdown-row">
        <span>− Grading Cost</span>
        <span style={{ color: 'var(--negative)' }}>−{fmt(gradingCost)}</span>
      </div>
      <div className="roi-breakdown-row total">
        <span>Net Profit</span>
        <span className={isPos ? 'val-pos' : 'val-neg'}>{formatProfit(profit)}</span>
      </div>
      <div className="roi-breakdown-row total" style={{ marginTop: 4 }}>
        <span>ROI</span>
        <span className={isPos ? 'val-pos' : 'val-neg'}>{formatROI(roiPct)}</span>
      </div>
    </div>
  );
}

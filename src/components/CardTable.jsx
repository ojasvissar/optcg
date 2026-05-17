import { useState } from 'react';
import { cardImageUrl } from '../utils/optcgApi.js';
import { fmt } from '../utils/formatCurrency.js';
import { formatROI, formatProfit } from '../utils/calculateROI.js';
import { RARITY_LABELS } from '../utils/cardMatcher.js';

const COLS = [
  { key: '',        label: '' },        // image
  { key: 'name',    label: 'Card' },
  { key: 'rarity',  label: 'Rarity' },
  { key: 'rawPrice',  label: 'Raw' },
  { key: 'psa9Price', label: 'PSA 9' },
  { key: 'psa10Price',label: 'PSA 10' },
  { key: 'psa9Roi',   label: 'ROI 9' },
  { key: 'psa10Roi',  label: 'ROI 10' },
  { key: 'psa9Profit',  label: 'Profit 9' },
  { key: 'psa10Profit', label: 'Profit 10' },
];

export default function CardTable({ cards, onCardClick, watchlist, onToggleWatch }) {
  const [sortCol, setSortCol] = useState('psa10Roi');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (!key) return;
    if (sortCol === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(key);
      setSortDir('desc');
    }
  };

  const sorted = [...(cards || [])].sort((a, b) => {
    const aVal = a[sortCol] ?? (sortDir === 'asc' ? Infinity : -Infinity);
    const bVal = b[sortCol] ?? (sortDir === 'asc' ? Infinity : -Infinity);
    if (typeof aVal === 'string') return sortDir === 'asc'
      ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  return (
    <div className="card-table-wrap">
      <table className="card-table">
        <thead>
          <tr>
            {COLS.map((col) => (
              <th
                key={col.key || 'img'}
                className={sortCol === col.key ? 'sorted' : ''}
                onClick={() => handleSort(col.key)}
              >
                {col.label}
                {sortCol === col.key && (sortDir === 'asc' ? ' ↑' : ' ↓')}
              </th>
            ))}
            <th>★</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((card) => {
            const isNeg = card.psa10Roi !== null && card.psa10Roi < 0;
            const roiClass = (val) => val === null ? 'table-roi-na' : val >= 0 ? 'table-roi-pos' : 'table-roi-neg';

            return (
              <tr
                key={card.id}
                className={isNeg ? 'negative-roi' : ''}
                onClick={() => onCardClick(card)}
              >
                <td>
                  <img
                    className="table-card-img"
                    src={cardImageUrl(card.imageId || card.id)}
                    alt={card.name}
                    loading="lazy"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </td>
                <td>
                  <div className="table-card-name">{card.name}</div>
                  <div className="table-card-id">{card.id}</div>
                </td>
                <td>
                  <span className={`rarity-badge rarity-${card.rarity}`}>
                    {RARITY_LABELS[card.rarity] || card.rarity}
                  </span>
                </td>
                <td className="table-price">{fmt(card.rawPrice)}</td>
                <td className="table-price">{card.psa9Price  ? fmt(card.psa9Price)  : <span className="table-roi-na">—</span>}</td>
                <td className="table-price">{card.psa10Price ? fmt(card.psa10Price) : <span className="table-roi-na">—</span>}</td>
                <td className={roiClass(card.psa9Roi)}>{formatROI(card.psa9Roi)}</td>
                <td className={roiClass(card.psa10Roi)}>{formatROI(card.psa10Roi)}</td>
                <td className={roiClass(card.psa9Profit)}>{formatProfit(card.psa9Profit)}</td>
                <td className={roiClass(card.psa10Profit)}>{formatProfit(card.psa10Profit)}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button
                    className={`star-btn${(watchlist || []).includes(card.id) ? ' starred' : ''}`}
                    onClick={() => onToggleWatch(card.id)}
                  >
                    {(watchlist || []).includes(card.id) ? '★' : '☆'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

import { fmt, fmtCompact } from '../utils/formatCurrency.js';
import { formatROI } from '../utils/calculateROI.js';
import { cardImageUrl } from '../utils/optcgApi.js';

export default function SummaryStats({ cards, enriched }) {
  if (!cards || cards.length === 0) return null;

  const withRoi = enriched.filter((c) => c.psa10Roi !== null);
  const gradeWorthy = withRoi.filter((c) => c.psa10Roi >= 50).length;
  const totalValue = enriched.reduce((sum, c) => sum + (c.rawPrice || 0), 0);

  const avgRoi =
    withRoi.length > 0
      ? withRoi.reduce((sum, c) => sum + c.psa10Roi, 0) / withRoi.length
      : null;

  const best = withRoi.length > 0
    ? withRoi.reduce((best, c) => (c.psa10Roi > (best?.psa10Roi ?? -Infinity) ? c : best), null)
    : null;

  return (
    <div className="summary-bar">
      <div className="stat-card yellow">
        <div className="stat-label">Cards in Set</div>
        <div className="stat-value yellow">{cards.length}</div>
      </div>

      <div className="stat-card lime">
        <div className="stat-label">Worth Grading</div>
        <div className="stat-value positive">{gradeWorthy}</div>
      </div>

      <div className="stat-card cyan">
        <div className="stat-label">Avg PSA 10 ROI</div>
        <div className={`stat-value ${avgRoi !== null ? (avgRoi >= 0 ? 'positive' : '') : ''}`}>
          {avgRoi !== null ? formatROI(avgRoi) : '—'}
        </div>
      </div>

      <div className="stat-card orange">
        <div className="stat-label">Set Raw Value</div>
        <div className="stat-value">{fmtCompact(totalValue)}</div>
      </div>

      {best && (
        <div className="stat-card pink">
          <div className="stat-label">Best Candidate</div>
          <div className="best-card-mini">
            <img
              src={cardImageUrl(best.imageId || best.id)}
              alt={best.name}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div>
              <div className="best-card-name">{best.name}</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11,
                            color: 'var(--positive)', fontWeight: 700, marginTop: 2 }}>
                {formatROI(best.psa10Roi)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

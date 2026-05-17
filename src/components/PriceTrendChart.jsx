import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useEffect, useState } from 'react';
import { fetchCardPriceHistory } from '../utils/optcgApi.js';
import { fmt } from '../utils/formatCurrency.js';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg2)', border: '2px solid var(--border2)',
      borderRadius: 6, padding: '6px 10px',
      fontFamily: 'Space Mono, monospace', fontSize: 11,
    }}>
      <div style={{ color: 'var(--amber2)' }}>{fmt(payload[0]?.value)}</div>
      <div style={{ color: 'var(--txt3)' }}>{payload[0]?.payload?.date}</div>
    </div>
  );
};

export default function PriceTrendChart({ cardId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cardId) return;
    setLoading(true);
    fetchCardPriceHistory(cardId)
      .then((raw) => {
        if (!raw) { setData([]); return; }
        const arr = Array.isArray(raw) ? raw : Object.entries(raw).map(([date, price]) => ({ date, price: parseFloat(price) || 0 }));
        setData(arr.filter((p) => p.price > 0));
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [cardId]);

  if (loading) return (
    <div className="chart-empty" style={{ height: 80 }}>Loading trend…</div>
  );

  if (!data || data.length < 2) return (
    <div className="chart-empty">No price trend data available</div>
  );

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
          <XAxis dataKey="date" hide />
          <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 9, fontFamily: 'Space Mono, monospace', fill: 'var(--txt3)' }} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="price"
            stroke="var(--amber2)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'var(--amber2)', stroke: '#000', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

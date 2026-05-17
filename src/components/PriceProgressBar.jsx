export default function PriceProgressBar({ done, total }) {
  if (!total) return null;
  const pct = Math.round((done / total) * 100);
  if (done >= total) return null;

  return (
    <div className="progress-bar-wrap">
      <span className="progress-text">⚡ Loading prices…</span>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-text mono">
        {done}/{total}
      </span>
    </div>
  );
}

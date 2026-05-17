export default function LoadingSkeleton({ count = 12 }) {
  return (
    <div className="card-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton skeleton-img" />
          <div className="skeleton-body">
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line short" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <div className="skeleton skeleton-line" style={{ height: 36 }} />
              <div className="skeleton skeleton-line" style={{ height: 36 }} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <div className="skeleton skeleton-line" style={{ flex: 1, height: 30 }} />
              <div className="skeleton skeleton-line" style={{ flex: 1, height: 30 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FallbackBanner({ onDismiss }) {
  return (
    <div className="fallback-banner">
      <span>⚠</span>
      <span>
        Add your{' '}
        <a href="https://tcgpricelookup.com/pricing" target="_blank" rel="noopener noreferrer">
          TCG Price Lookup API key
        </a>{' '}
        in Settings to unlock real PSA graded prices. Currently showing estimated ROI using
        multipliers.
      </span>
      <button className="fallback-banner-dismiss" onClick={onDismiss} title="Dismiss">
        ✕
      </button>
    </div>
  );
}

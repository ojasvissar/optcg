import { FALLBACK_SETS } from '../utils/optcgApi.js';

export default function SetSelector({ sets, loading, value, onChange }) {
  const displaySets = sets && sets.length > 0 ? sets : FALLBACK_SETS;

  return (
    <select
      className="set-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={loading}
    >
      <option value="">
        {loading ? 'Loading sets…' : '— Select a Set —'}
      </option>
      {displaySets.map((s) => (
        <option key={s.id} value={s.id}>
          {s.id} — {s.name}
        </option>
      ))}
    </select>
  );
}

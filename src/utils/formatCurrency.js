// All prices are displayed in CAD. Raw API prices are USD and get multiplied
// by the exchange rate before being passed here.
export function fmt(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return `CA$${Number(value).toFixed(decimals)}`;
}

export function fmtCompact(value) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  if (value >= 1000) return `CA$${(value / 1000).toFixed(1)}k`;
  return `CA$${Number(value).toFixed(0)}`;
}

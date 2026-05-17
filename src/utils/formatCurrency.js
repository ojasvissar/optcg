export function fmt(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return `$${Number(value).toFixed(decimals)}`;
}

export function fmtCompact(value) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${Number(value).toFixed(0)}`;
}

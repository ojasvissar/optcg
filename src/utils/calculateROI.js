/**
 * ROI = (Graded Price − Raw Price − Grading Cost) / (Raw Price + Grading Cost) * 100
 * Profit = Graded Price − Raw Price − Grading Cost
 */
export function calcROI(gradedPrice, rawPrice, gradingCost) {
  if (!gradedPrice || !rawPrice || rawPrice <= 0) return null;
  const profit = gradedPrice - rawPrice - gradingCost;
  const investment = rawPrice + gradingCost;
  return {
    roi: (profit / investment) * 100,
    profit,
  };
}

export function calcEstimatedPrices(rawPrice, psa9Mult, psa10Mult) {
  if (!rawPrice || rawPrice <= 0) return { psa9: null, psa10: null };
  return {
    psa9:  rawPrice * psa9Mult,
    psa10: rawPrice * psa10Mult,
  };
}

export function isGradeWorthy(roi, threshold = 50) {
  return roi !== null && roi >= threshold;
}

export function formatROI(roi) {
  if (roi === null || roi === undefined) return '—';
  const sign = roi >= 0 ? '+' : '';
  return `${sign}${roi.toFixed(1)}%`;
}

export function formatProfit(profit) {
  if (profit === null || profit === undefined) return '—';
  const sign = profit >= 0 ? '+' : '-';
  return `${sign}$${Math.abs(profit).toFixed(2)}`;
}

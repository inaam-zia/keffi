export const POINTS_PER_RUPEE_SPENT = 0.1; // ₹10 spent = 1 point
export const RUPEES_PER_POINT = 0.1; // 10 points = ₹1

export function pointsEarnedForTotal(total: number): number {
  return Math.floor(Math.max(0, total) * POINTS_PER_RUPEE_SPENT);
}

export function rupeesFromPoints(points: number): number {
  return Math.round(Math.max(0, points) * RUPEES_PER_POINT * 100) / 100;
}

export function maxRedeemablePoints(points: number, remainingRupees: number): number {
  const available = Math.max(0, Math.floor(points));
  const byTotal = Math.floor(Math.max(0, remainingRupees) / RUPEES_PER_POINT);
  return Math.min(available, byTotal);
}

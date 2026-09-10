export function estimateWaitMinutes(newCount: number, preparingCount: number): number {
  if (newCount + preparingCount <= 0) return 5;
  const minutes = 6 + newCount * 5 + preparingCount * 4;
  return Math.min(45, Math.max(5, minutes));
}

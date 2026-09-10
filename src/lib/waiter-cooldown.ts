export const WAITER_COOLDOWN_MS = 5 * 60 * 1000;

function storageKey(tableNumber: number): string {
  return `cafe-waiter-cooldown:${tableNumber}`;
}

export function readWaiterCooldownUntil(tableNumber: number): number {
  try {
    const raw = localStorage.getItem(storageKey(tableNumber));
    const until = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(until) ? until : 0;
  } catch {
    return 0;
  }
}

export function startWaiterCooldown(tableNumber: number, remainingMs = WAITER_COOLDOWN_MS): number {
  const until = Date.now() + Math.max(0, remainingMs);
  try {
    localStorage.setItem(storageKey(tableNumber), String(until));
  } catch {
    /* ignore */
  }
  return until;
}

export function formatCooldown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

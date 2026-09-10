export const REORDER_STORAGE_KEY = "cafe-reorder";

export type ReorderLine = {
  name: string;
  quantity: number;
  notes?: string;
  spiceLevel?: string;
};

export function saveReorderLines(lines: ReorderLine[]) {
  const cleaned = lines
    .filter((line) => line.name && line.quantity > 0)
    .map((line) => ({
      name: line.name,
      quantity: line.quantity,
      notes: line.notes || undefined,
      spiceLevel: line.spiceLevel || undefined,
    }));
  try {
    localStorage.setItem(REORDER_STORAGE_KEY, JSON.stringify(cleaned));
  } catch {
    /* private mode */
  }
}

export function takeReorderLines(): ReorderLine[] {
  try {
    const raw = localStorage.getItem(REORDER_STORAGE_KEY);
    if (!raw) return [];
    localStorage.removeItem(REORDER_STORAGE_KEY);
    const parsed = JSON.parse(raw) as ReorderLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

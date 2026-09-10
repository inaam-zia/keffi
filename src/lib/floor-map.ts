export const SERVED_UNPAID_WINDOW_MS = 12 * 60 * 60 * 1000;

export type FloorTableState =
  | "free"
  | "new"
  | "preparing"
  | "kitchen"
  | "served"
  | "disabled";

export type FloorTable = {
  id: string;
  tableNumber: number;
  label: string | null;
  enabled: boolean;
  orphan: boolean;
  state: FloorTableState;
  newCount: number;
  preparingCount: number;
  servedCount: number;
  takeawayCount: number;
  ticketCount: number;
  waiter: boolean;
  bill: boolean;
  guests: string[];
};

export type FloorOrderRow = {
  table_number: number | null;
  status: string | null;
  customer_name?: string | null;
  order_type?: string | null;
  payment_method?: string | null;
  created_at?: string | null;
};

export type FloorRequestRow = {
  table_number: number | null;
  kind: string | null;
};

export type FloorCafeTable = {
  id: string;
  table_number: number;
  label?: string | null;
  enabled: boolean;
};

type TableStats = {
  newCount: number;
  preparingCount: number;
  servedCount: number;
  takeawayCount: number;
  waiter: boolean;
  bill: boolean;
  guests: string[];
};

function emptyStats(): TableStats {
  return {
    newCount: 0,
    preparingCount: 0,
    servedCount: 0,
    takeawayCount: 0,
    waiter: false,
    bill: false,
    guests: [],
  };
}

function addGuest(stats: TableStats, name: string | null | undefined) {
  const trimmed = name?.trim();
  if (!trimmed) return;
  if (!stats.guests.some((g) => g.toLowerCase() === trimmed.toLowerCase())) {
    stats.guests.push(trimmed);
  }
}

export function isActiveFloorOrder(order: FloorOrderRow, now = Date.now()): boolean {
  const status = order.status;
  if (status === "new" || status === "preparing") return true;
  if (status !== "served") return false;
  if (order.payment_method?.trim()) return false;
  const created = order.created_at ? new Date(order.created_at).getTime() : NaN;
  if (!Number.isFinite(created)) return true;
  return now - created <= SERVED_UNPAID_WINDOW_MS;
}

export function floorStateFor(stats: {
  enabled: boolean;
  newCount: number;
  preparingCount: number;
  servedCount: number;
}): FloorTableState {
  const kitchen = stats.newCount + stats.preparingCount;
  if (!stats.enabled && kitchen === 0 && stats.servedCount === 0) return "disabled";
  if (kitchen > 0) {
    if (stats.newCount > 0 && stats.preparingCount === 0) return "new";
    if (stats.preparingCount > 0 && stats.newCount === 0) return "preparing";
    return "kitchen";
  }
  if (stats.servedCount > 0) return "served";
  return stats.enabled ? "free" : "disabled";
}

export function buildFloorTables(input: {
  tables: FloorCafeTable[];
  orders: FloorOrderRow[];
  requests: FloorRequestRow[];
  labels?: Map<number, string>;
  now?: number;
}): FloorTable[] {
  const now = input.now ?? Date.now();
  const byTable = new Map<number, TableStats>();

  function statsFor(tableNumber: number): TableStats {
    const existing = byTable.get(tableNumber);
    if (existing) return existing;
    const created = emptyStats();
    byTable.set(tableNumber, created);
    return created;
  }

  for (const order of input.orders) {
    const tableNumber = Number(order.table_number);
    if (!Number.isFinite(tableNumber) || tableNumber < 1) continue;
    if (!isActiveFloorOrder(order, now)) continue;
    const stats = statsFor(tableNumber);
    if (order.status === "new") stats.newCount += 1;
    else if (order.status === "preparing") stats.preparingCount += 1;
    else if (order.status === "served") stats.servedCount += 1;
    if (order.order_type === "takeaway") stats.takeawayCount += 1;
    addGuest(stats, order.customer_name);
  }

  for (const req of input.requests) {
    const tableNumber = Number(req.table_number);
    if (!Number.isFinite(tableNumber) || tableNumber < 1) continue;
    const stats = statsFor(tableNumber);
    if (req.kind === "waiter") stats.waiter = true;
    if (req.kind === "bill") stats.bill = true;
  }

  const result: FloorTable[] = [];
  const seen = new Set<number>();

  for (const table of input.tables) {
    const tableNumber = Number(table.table_number);
    if (!Number.isFinite(tableNumber)) continue;
    seen.add(tableNumber);
    const stats = byTable.get(tableNumber) ?? emptyStats();
    const ticketCount = stats.newCount + stats.preparingCount + stats.servedCount;
    result.push({
      id: table.id,
      tableNumber,
      label: input.labels?.get(tableNumber) || table.label?.trim() || null,
      enabled: Boolean(table.enabled),
      orphan: false,
      state: floorStateFor({
        enabled: Boolean(table.enabled),
        newCount: stats.newCount,
        preparingCount: stats.preparingCount,
        servedCount: stats.servedCount,
      }),
      newCount: stats.newCount,
      preparingCount: stats.preparingCount,
      servedCount: stats.servedCount,
      takeawayCount: stats.takeawayCount,
      ticketCount,
      waiter: stats.waiter,
      bill: stats.bill,
      guests: stats.guests,
    });
  }

  for (const [tableNumber, stats] of Array.from(byTable.entries())) {
    if (seen.has(tableNumber)) continue;
    const ticketCount = stats.newCount + stats.preparingCount + stats.servedCount;
    result.push({
      id: `orphan-${tableNumber}`,
      tableNumber,
      label: input.labels?.get(tableNumber) || null,
      enabled: true,
      orphan: true,
      state: floorStateFor({
        enabled: true,
        newCount: stats.newCount,
        preparingCount: stats.preparingCount,
        servedCount: stats.servedCount,
      }),
      newCount: stats.newCount,
      preparingCount: stats.preparingCount,
      servedCount: stats.servedCount,
      takeawayCount: stats.takeawayCount,
      ticketCount,
      waiter: stats.waiter,
      bill: stats.bill,
      guests: stats.guests,
    });
  }

  return result.sort((a, b) => a.tableNumber - b.tableNumber);
}

export function floorStateLabel(state: FloorTableState): string {
  switch (state) {
    case "free":
      return "Free";
    case "new":
      return "New";
    case "preparing":
      return "Preparing";
    case "kitchen":
      return "In kitchen";
    case "served":
      return "Served · unpaid";
    case "disabled":
      return "Disabled";
  }
}

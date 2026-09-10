const LAST_TABLE_KEY = "cafe-last-table";
const MENU_SEARCH_KEY = "cafe-menu-search";
const MENU_CATEGORY_KEY = "cafe-menu-category";

function readStorage(key: string): string {
  try {
    return sessionStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function writeStorage(key: string, value: string) {
  try {
    if (value) sessionStorage.setItem(key, value);
    else sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function rememberLastTable(tableNumber: number) {
  if (!Number.isFinite(tableNumber) || tableNumber < 1) return;
  writeStorage(LAST_TABLE_KEY, String(tableNumber));
}

export function readLastTableNumber(): number | null {
  const n = Number(readStorage(LAST_TABLE_KEY));
  return Number.isFinite(n) && n >= 1 ? n : null;
}

export function getCustomerMenuHref(): string {
  const table = readLastTableNumber();
  return table ? `/order/${table}` : "/";
}

export function readMenuSearch(): string {
  return readStorage(MENU_SEARCH_KEY);
}

export function writeMenuSearch(query: string) {
  writeStorage(MENU_SEARCH_KEY, query);
}

export function readMenuCategory(): string | null {
  return readStorage(MENU_CATEGORY_KEY) || null;
}

export function writeMenuCategory(key: string | null) {
  writeStorage(MENU_CATEGORY_KEY, key || "");
}

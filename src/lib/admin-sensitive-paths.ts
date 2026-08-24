/** Admin paths that stay open without a second password. All sections are open. */
export const OPEN_ADMIN_PATHS = [
  "/admin/orders",
  "/admin/dashboard",
  "/admin/customers",
  "/admin/menu",
  "/admin/offers",
  "/admin/inventory",
  "/admin/recipes",
  "/admin/insights",
  "/admin/tables",
  "/admin/branding",
  "/admin/payment",
  "/admin/history",
  "/admin/settings",
] as const;

export function isSensitiveAdminPath(_pathname: string): boolean {
  return false;
}

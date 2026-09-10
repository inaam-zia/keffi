export type AdminRole = "owner" | "kitchen" | "cashier";

export const ADMIN_ROLE_COOKIE = "cafe_admin_role";

export const ROLE_HOME: Record<AdminRole, string> = {
  owner: "/admin/orders",
  kitchen: "/admin/kitchen",
  cashier: "/admin/orders",
};

const ROLE_PATHS: Record<AdminRole, string[]> = {
  owner: ["*"],
  kitchen: ["/admin/kitchen", "/admin/orders", "/admin/menu"],
  cashier: [
    "/admin/orders",
    "/admin/history",
    "/admin/day-close",
    "/admin/payment",
    "/admin/reservations",
    "/admin/coupons",
  ],
};

export function isAdminRole(value: string | undefined | null): value is AdminRole {
  return value === "owner" || value === "kitchen" || value === "cashier";
}

export function getAdminRoleCookieConfig(role: AdminRole) {
  return {
    name: ADMIN_ROLE_COOKIE,
    value: role,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function roleCanAccessPath(role: AdminRole, pathname: string): boolean {
  if (role === "owner") return true;
  const allowed = ROLE_PATHS[role];
  return allowed.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function navLinksForRole(
  role: AdminRole,
  links: { href: string; label: string }[]
): { href: string; label: string }[] {
  return links.filter((link) => roleCanAccessPath(role, link.href));
}

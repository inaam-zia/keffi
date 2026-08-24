"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import DeveloperCredit from "@/components/developer-credit";
import { NewOrdersProvider, useNewOrders } from "./new-orders-context";

// Admin always uses Open Sans regardless of the customer-facing theme font.
const adminFontStyle = {
  "--brand-font-family": "var(--font-open-sans), system-ui, sans-serif",
  fontFamily: "var(--font-open-sans), system-ui, sans-serif",
} as CSSProperties;

const links = [
  { href: "/admin/orders", label: "Live orders" },
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/offers", label: "Offers" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/recipes", label: "Recipes" },
  { href: "/admin/insights", label: "Insights" },
  { href: "/admin/tables", label: "Table QR" },
  { href: "/admin/branding", label: "Appearance" },
  { href: "/admin/payment", label: "Payment QR" },
  { href: "/admin/history", label: "History" },
  { href: "/admin/settings", label: "Settings" },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { newOrderCount } = useNewOrders();
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadAlerts() {
      try {
        const res = await fetch("/api/admin/inventory/alerts");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setLowStockCount(Number(data.count) || 0);
      } catch {
        /* ignore — table may not exist yet */
      }
    }
    loadAlerts();
    const interval = setInterval(loadAlerts, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div
      className="admin-shell flex min-h-screen min-h-dvh flex-col"
      style={adminFontStyle}
    >
      <header className="sticky top-0 z-40 shrink-0 border-b border-brand bg-brand-surface/95 backdrop-blur-md [padding-top:env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:py-4">
          <h1 className="text-base font-bold text-brand-heading sm:text-lg">Cafe Admin</h1>
          <button
            onClick={logout}
            className="shrink-0 text-sm text-brand-muted hover:text-brand-heading"
          >
            Log out
          </button>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-3 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {links.map((link) => {
            const active = pathname === link.href;
            const isLiveOrders = link.href === "/admin/orders";
            const isInventory = link.href === "/admin/inventory";
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition sm:px-4 ${
                  active ? "nav-active" : "nav-inactive"
                }`}
              >
                {link.label}
                {isLiveOrders && newOrderCount > 0 && (
                  <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                    {newOrderCount > 99 ? "99+" : newOrderCount}
                  </span>
                )}
                {isInventory && lowStockCount > 0 && (
                  <span
                    className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white"
                    title={`${lowStockCount} low-stock item${lowStockCount === 1 ? "" : "s"}`}
                  >
                    {lowStockCount > 99 ? "99+" : lowStockCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 [padding-bottom:calc(1.5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <footer className="mx-auto w-full max-w-5xl shrink-0 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2">
        <DeveloperCredit />
      </footer>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return (
      <div style={adminFontStyle} className="admin-shell flex min-h-screen min-h-dvh flex-col">
        <div className="flex-1">{children}</div>
        <footer className="shrink-0 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2">
          <DeveloperCredit />
        </footer>
      </div>
    );
  }

  return (
    <NewOrdersProvider>
      <AdminShell>{children}</AdminShell>
    </NewOrdersProvider>
  );
}

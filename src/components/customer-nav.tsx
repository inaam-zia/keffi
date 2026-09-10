"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useCustomerLocale } from "@/components/customer-locale-provider";
import { getCustomerMenuHref } from "@/lib/customer-menu-session";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { copy, toggleLocale } = useCustomerLocale();
  return (
    <button
      type="button"
      className={`rounded-full border border-brand px-2.5 py-1 text-[11px] font-semibold ${className}`.trim()}
      onClick={toggleLocale}
    >
      {copy.language}
    </button>
  );
}

export default function CustomerNav({
  className = "",
  homeHref: homeHrefProp,
  onHomeClick,
}: {
  className?: string;
  /** Table menu URL when the guest already has a table session */
  homeHref?: string;
  /** Same-page return to the full menu (keeps filters) */
  onHomeClick?: () => void;
}) {
  const pathname = usePathname() || "/";
  const { copy } = useCustomerLocale();
  const [storedHomeHref, setStoredHomeHref] = useState("/");

  useEffect(() => {
    setStoredHomeHref(getCustomerMenuHref());
  }, [pathname]);

  const homeHref = homeHrefProp || storedHomeHref;
  const links = [
    { href: homeHref, label: copy.navHome, id: "home" as const },
    { href: "/reserve", label: copy.navReserve, id: "reserve" as const },
  ];

  return (
    <nav className={`flex flex-wrap items-center gap-2 ${className}`.trim()} aria-label="Customer">
      <LanguageToggle />
      {links.map((link) => {
        const active =
          link.id === "home"
            ? homeHref === "/"
              ? pathname === "/"
              : pathname === homeHref || pathname.startsWith("/order/")
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.id}
            href={link.href}
            onClick={(e) => {
              if (link.id === "home" && onHomeClick) {
                e.preventDefault();
                onHomeClick();
              }
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              active
                ? "bg-[var(--brand-primary)] text-[var(--brand-button-text)]"
                : "bg-white text-brand-muted shadow-sm"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

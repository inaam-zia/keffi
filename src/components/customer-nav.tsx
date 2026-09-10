"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCustomerLocale } from "@/components/customer-locale-provider";

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
}: {
  className?: string;
}) {
  const pathname = usePathname() || "/";
  const { copy } = useCustomerLocale();
  const links = [
    { href: "/", label: copy.navHome },
    { href: "/reserve", label: copy.navReserve },
    { href: "/my-orders", label: copy.navMyOrders },
  ];

  return (
    <nav className={`flex flex-wrap items-center gap-2 ${className}`.trim()} aria-label="Customer">
      <LanguageToggle />
      {links.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/"
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
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

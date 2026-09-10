"use client";

import Link from "next/link";
import CafeBrandingBlock from "@/components/cafe-branding-block";
import CustomerNav from "@/components/customer-nav";
import DeveloperCredit from "@/components/developer-credit";
import { useCustomerLocale } from "@/components/customer-locale-provider";
import type { CafeBranding } from "@/lib/branding-types";

export default function HomeClient({ branding }: { branding: CafeBranding }) {
  const { copy } = useCustomerLocale();

  return (
    <main className="mx-auto flex min-h-screen min-h-dvh max-w-lg flex-col px-6 text-center">
      <div className="flex flex-1 flex-col items-center justify-center py-10">
        <div className="card w-full space-y-6">
          <CafeBrandingBlock branding={branding} logoSize="lg" showTagline align="center" />
          <CustomerNav className="justify-center" />

          <div className="rounded-xl bg-brand-top px-4 py-3 text-sm text-brand-muted">
            {copy.noAppNeeded}
          </div>

          <Link href="/reserve" className="btn-secondary w-full">
            {copy.reserve}
          </Link>
          <Link href="/my-orders" className="btn-secondary w-full">
            {copy.myOrders}
          </Link>
        </div>
      </div>
      <DeveloperCredit className="shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2" />
    </main>
  );
}

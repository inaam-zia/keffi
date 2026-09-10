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
    <main className="mx-auto flex min-h-screen min-h-dvh w-full max-w-5xl flex-col px-6">
      <div className="flex flex-1 flex-col justify-center py-10 md:flex-row md:items-center md:gap-16">
        <div className="mx-auto w-full max-w-lg md:mx-0 md:flex-1">
          <CafeBrandingBlock branding={branding} logoSize="lg" showTagline align="center" />
        </div>
        <div className="mx-auto mt-8 w-full max-w-md md:mx-0 md:mt-0 md:flex-1">
          <div className="card space-y-6 text-center md:text-left">
            <CustomerNav className="justify-center md:justify-start" />
            <div className="rounded-xl bg-brand-top px-4 py-3 text-sm text-brand-muted">
              {copy.noAppNeeded}
            </div>
            <Link href="/reserve" className="btn-secondary w-full">
              {copy.reserve}
            </Link>
          </div>
        </div>
      </div>
      <DeveloperCredit className="shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2" />
    </main>
  );
}

"use client";

import type { CafeBranding } from "@/lib/branding-types";

type Props = {
  branding: CafeBranding;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "h-8 max-w-[120px]",
  md: "h-12 max-w-[180px]",
  lg: "h-16 max-w-[240px]",
};

const LOCAL_LOGO_FALLBACKS = ["/keffi-logo.png", "/teakuzz-logo.png"];

export default function CafeLogo({ branding, size = "md", className = "" }: Props) {
  const initialSrc = branding.logoUrl?.trim() || LOCAL_LOGO_FALLBACKS[0];

  if (!initialSrc) {
    return (
      <span
        className={`font-bold text-[var(--brand-heading)] ${className}`}
        style={{ fontSize: size === "lg" ? "var(--brand-font-size-heading)" : "1.125rem" }}
      >
        {branding.appName}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={initialSrc}
      alt={branding.appName}
      className={`object-contain ${sizes[size]} ${className}`}
      onError={(event) => {
        const img = event.currentTarget;
        const current = img.getAttribute("src") || "";
        const tried = new Set(
          (img.dataset.tried || "")
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
        );
        tried.add(current);
        const next = LOCAL_LOGO_FALLBACKS.find((url) => !tried.has(url));
        if (!next) {
          img.style.display = "none";
          return;
        }
        img.dataset.tried = Array.from(tried).join(",");
        img.src = next;
      }}
    />
  );
}

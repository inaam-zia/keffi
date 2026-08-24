export type CafeTheme = {
  colorPrimary: string;
  colorPrimaryHover: string;
  colorBackground: string;
  colorBackgroundTop: string;
  colorSurface: string;
  colorBorder: string;
  colorHeaderBg: string;
  colorFooterBg: string;
  colorHeading: string;
  colorBody: string;
  colorMuted: string;
  colorSubtle: string;
  colorButtonText: string;
  colorAccent: string;
  fontFamily: string;
  fontSizeBase: string;
  fontSizeHeading: string;
  fontSizeSmall: string;
};

export type CafeBranding = {
  appName: string;
  logoUrl: string | null;
  tagline: string;
  theme: CafeTheme;
  /** When true, show GSTIN on bills and apply GST % when set */
  gstEnabled: boolean;
  /** GST Identification Number */
  gstin: string | null;
  /** CGST percentage on subtotal (e.g. 2.5) */
  cgstPercent: number;
  /** SGST percentage on subtotal (e.g. 2.5) */
  sgstPercent: number;
};

export const DEFAULT_THEME: CafeTheme = {
  colorPrimary: "#1a4a45",
  colorPrimaryHover: "#143a36",
  colorBackground: "#f4f7f6",
  colorBackgroundTop: "#e6eeec",
  colorSurface: "#ffffff",
  colorBorder: "#d5e0dd",
  colorHeaderBg: "rgba(255,255,255,0.9)",
  colorFooterBg: "rgba(255,255,255,0.96)",
  colorHeading: "#1a4a45",
  colorBody: "#1f3d3a",
  colorMuted: "#4d6b66",
  colorSubtle: "#c9a227",
  colorButtonText: "#ffffff",
  colorAccent: "#c9a227",
  fontFamily: "lora",
  fontSizeBase: "16px",
  fontSizeHeading: "24px",
  fontSizeSmall: "14px",
};

export const FONT_OPTIONS = [
  {
    id: "open-sans",
    label: "Open Sans",
    // Literal "Open Sans" keeps a sans fallback if the Next font var is missing
    // (otherwise an invalid var() makes the whole font-family fall back to Times).
    css: 'var(--font-open-sans), "Open Sans", system-ui, sans-serif',
  },
  {
    id: "dm-sans",
    label: "DM Sans",
    css: 'var(--font-dm-sans), "DM Sans", system-ui, sans-serif',
  },
  {
    id: "inter",
    label: "Inter",
    css: 'var(--font-inter), Inter, system-ui, sans-serif',
  },
  {
    id: "poppins",
    label: "Poppins",
    css: 'var(--font-poppins), Poppins, system-ui, sans-serif',
  },
  {
    id: "lora",
    label: "Lora",
    css: 'var(--font-lora), Lora, Georgia, serif',
  },
  { id: "system", label: "System default", css: "system-ui, sans-serif" },
] as const;

export function resolveFontFamilyId(raw?: string | null): string {
  const id = String(raw || "").trim().toLowerCase();
  if (FONT_OPTIONS.some((f) => f.id === id)) return id;
  // Common aliases / mistakes from saved theme data
  if (id.includes("open")) return "open-sans";
  if (id.includes("dm")) return "dm-sans";
  if (id.includes("inter")) return "inter";
  if (id.includes("poppin")) return "poppins";
  if (id.includes("lora")) return "lora";
  if (id.includes("system")) return "system";
  return "open-sans";
}

export function getDefaultBranding(): CafeBranding {
  const envName = process.env.NEXT_PUBLIC_CAFE_NAME;
  return {
    appName: envName || "Keffi",
    logoUrl: "/keffi-logo.png",
    tagline: "Crafted to Refresh",
    theme: { ...DEFAULT_THEME },
    gstEnabled: false,
    gstin: null,
    cgstPercent: 0,
    sgstPercent: 0,
  };
}

export function mergeTheme(partial?: Partial<CafeTheme> | null): CafeTheme {
  const merged = { ...DEFAULT_THEME, ...(partial || {}) };
  merged.fontFamily = resolveFontFamilyId(merged.fontFamily);
  return merged;
}

export function themeToCssVars(theme: CafeTheme): Record<string, string> {
  const fontId = resolveFontFamilyId(theme.fontFamily);
  const font = FONT_OPTIONS.find((f) => f.id === fontId) || FONT_OPTIONS[0];

  return {
    "--brand-primary": theme.colorPrimary,
    "--brand-primary-hover": theme.colorPrimaryHover,
    "--brand-bg": theme.colorBackground,
    "--brand-bg-top": theme.colorBackgroundTop,
    "--brand-surface": theme.colorSurface,
    "--brand-border": theme.colorBorder,
    "--brand-header-bg": theme.colorHeaderBg,
    "--brand-footer-bg": theme.colorFooterBg,
    "--brand-heading": theme.colorHeading,
    "--brand-text": theme.colorBody,
    "--brand-muted": theme.colorMuted,
    "--brand-subtle": theme.colorSubtle,
    "--brand-button-text": theme.colorButtonText,
    "--brand-accent": theme.colorAccent,
    "--brand-font-family": font.css,
    "--brand-font-size-base": theme.fontSizeBase,
    "--brand-font-size-heading": theme.fontSizeHeading,
    "--brand-font-size-small": theme.fontSizeSmall,
  };
}

export function brandingToStyleString(branding: CafeBranding): string {
  const vars = themeToCssVars(branding.theme);
  const lines = Object.entries(vars).map(([k, v]) => `${k}: ${v};`);
  return `:root { ${lines.join(" ")} }`;
}

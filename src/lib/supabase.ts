import { createClient } from "@supabase/supabase-js";

function normalizeSupabaseUrl(url: string): string {
  return url
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/$/, "");
}

function isUsableHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

const DEFAULT_SUPABASE_URL = "https://vnueqhizyysseoroojhh.supabase.co";

export function getSupabaseHttpUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (url) {
    const normalized = normalizeSupabaseUrl(url);
    if (isUsableHttpUrl(normalized)) return normalized;
  }
  // Vercel previously stored an encrypted blob as NEXT_PUBLIC_SUPABASE_URL.
  return DEFAULT_SUPABASE_URL;
}

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseHttpUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return false;
  if (key === "your-service-role-key" || key === "REPLACE_WITH_SERVICE_ROLE_KEY") return false;
  // Encrypted Vercel blob copied as the value is not a usable API key
  if (key.startsWith("eyJ2IjoidjIi")) return false;
  return true;
}

export function createServerClient() {
  const url = getSupabaseHttpUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || !isSupabaseConfigured()) {
    throw new Error(
      "Database not configured. Add your Supabase keys to .env.local (or Vercel env vars) and run supabase/schema.sql."
    );
  }

  return createClient(url, key);
}

export function createBrowserClient() {
  const url = getSupabaseHttpUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase public env vars.");
  }

  return createClient(url, key);
}


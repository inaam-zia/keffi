/**
 * Schema health check for Teakuzz (no row contents printed).
 * Usage: node scripts/audit-database.mjs
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  try {
    for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key);

const tables = [
  "menu_categories",
  "menu_items",
  "orders",
  "order_items",
  "otp_verifications",
  "cafe_tables",
  "cafe_settings",
  "offers",
  "offer_items",
  "inventory_items",
  "recipes",
  "recipe_ingredients",
  "inventory_deductions",
  "dish_feedback",
  "payment_qr_codes",
];

const columns = [
  ["orders", "customer_phone"],
  ["orders", "customer_email"],
  ["cafe_tables", "session_id"],
  ["cafe_tables", "qr_token"],
  ["cafe_tables", "label"],
  ["cafe_settings", "gst_enabled"],
  ["cafe_settings", "cgst_percent"],
  ["cafe_settings", "admin_password_hash"],
  ["payment_qr_codes", "upi_id"],
  ["menu_items", "image_url"],
];

const missing = [];

console.log("=== Tables ===");
for (const table of tables) {
  const { error, count } = await sb.from(table).select("id", { count: "exact", head: true });
  if (error) {
    console.log(`MISSING  ${table} — ${error.message}`);
    missing.push(table);
  } else {
    console.log(`OK       ${table} (${count ?? 0})`);
  }
}

console.log("\n=== Columns ===");
for (const [table, col] of columns) {
  const { error } = await sb.from(table).select(col).limit(0);
  if (error) {
    console.log(`MISSING  ${table}.${col} — ${error.message}`);
    missing.push(`${table}.${col}`);
  } else {
    console.log(`OK       ${table}.${col}`);
  }
}

console.log("\n=== Storage buckets ===");
const { data: buckets, error: bErr } = await sb.storage.listBuckets();
if (bErr) {
  console.log(`ERROR    ${bErr.message}`);
} else {
  const names = (buckets || []).map((b) => b.id).sort();
  console.log(names.length ? names.join(", ") : "(none)");
  for (const need of ["branding", "menu-images"]) {
    if (!names.includes(need)) missing.push(`bucket:${need}`);
  }
}

console.log("\n=== Branding ===");
const { data: settings, error: sErr } = await sb
  .from("cafe_settings")
  .select("app_name, tagline, logo_url, gst_enabled")
  .eq("id", 1)
  .maybeSingle();
if (sErr) console.log(`ERROR    ${sErr.message}`);
else console.log(JSON.stringify(settings));

console.log("\n=== Env ===");
console.log(`SUPABASE_DB_URL set: ${process.env.SUPABASE_DB_URL ? "yes" : "no"}`);

if (missing.length) {
  console.log(`\nNeeds migration for: ${missing.join(", ")}`);
  process.exit(2);
}
console.log("\nDatabase looks fully configured.");

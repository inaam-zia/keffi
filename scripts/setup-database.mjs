/**
 * Apply supabase/setup-all.sql via Postgres, then seed the Teakuzz menu.
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SUPABASE_DB_URL  (Settings → Database → Connection string → URI)
 *
 * Usage: node scripts/setup-database.mjs
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { spawnSync } from "child_process";

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
const dbUrl = process.env.SUPABASE_DB_URL;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

if (!dbUrl) {
  console.error(`
Missing SUPABASE_DB_URL in .env.local.

1. Open Supabase → Project Settings → Database
2. Copy Connection string → URI (include password)
3. Add to .env.local:
   SUPABASE_DB_URL=postgresql://postgres.[ref]:[PASSWORD]@...

Or paste supabase/setup-all.sql into the SQL Editor manually, then run:
   npm run seed:menu
`);
  process.exit(1);
}

const sql = readFileSync(join(root, "supabase/setup-all.sql"), "utf8");

console.log(`Connecting to database for ${url}…`);
const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("Applying supabase/setup-all.sql…");
  await client.query(sql);
  console.log("Schema applied.");
} catch (err) {
  console.error("SQL failed:", err.message);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}

console.log("Seeding Teakuzz menu…");
const seed = spawnSync(process.execPath, [join(root, "scripts/seed-teakuzz-menu.mjs")], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
if (seed.status !== 0) process.exit(seed.status ?? 1);

console.log("Auditing…");
const audit = spawnSync(process.execPath, [join(root, "scripts/audit-database.mjs")], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
process.exit(audit.status ?? 0);

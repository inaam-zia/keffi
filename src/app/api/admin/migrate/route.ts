import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/supabase-errors";

const MIGRATION_SQL = `
alter table orders add column if not exists customer_phone text;
create index if not exists orders_customer_phone_idx on orders (customer_phone);
alter table orders add column if not exists customer_email text;
create index if not exists orders_customer_email_idx on orders (customer_email);
create table if not exists otp_verifications (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int default 0,
  created_at timestamptz default now()
);
create index if not exists otp_verifications_phone_idx on otp_verifications (phone, created_at desc);
create table if not exists cafe_tables (
  id uuid primary key default gen_random_uuid(),
  table_number int not null unique,
  enabled boolean default true,
  created_at timestamptz default now()
);
create index if not exists cafe_tables_number_idx on cafe_tables (table_number);
insert into cafe_tables (table_number, enabled)
select v.n, true from generate_series(1, 7) as v(n)
where not exists (select 1 from cafe_tables);
alter table cafe_settings add column if not exists wifi_ssid text;
alter table cafe_settings add column if not exists wifi_password text;
alter table cafe_settings add column if not exists busy_mode boolean default false;
alter table cafe_settings add column if not exists kitchen_password_hash text;
alter table cafe_settings add column if not exists cashier_password_hash text;
alter table menu_items add column if not exists name_hi text default '';
alter table menu_items add column if not exists description_hi text default '';
alter table menu_items add column if not exists is_veg boolean default true;
alter table menu_items add column if not exists is_jain boolean default false;
alter table menu_items add column if not exists allergens text default '';
alter table order_items add column if not exists notes text default '';
alter table order_items add column if not exists spice_level text;
alter table orders add column if not exists notes text default '';
alter table orders add column if not exists order_type text default 'dine_in';
alter table orders add column if not exists coupon_code text;
alter table orders add column if not exists discount numeric(10, 2) default 0;
alter table orders add column if not exists loyalty_redeemed int default 0;
alter table orders add column if not exists payment_method text;
create table if not exists table_requests (
  id uuid primary key default gen_random_uuid(),
  table_number int not null,
  kind text not null check (kind in ('waiter', 'bill')),
  status text not null default 'open' check (status in ('open', 'done')),
  created_at timestamptz default now()
);
create index if not exists table_requests_open_idx on table_requests (status, created_at desc);
create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text default '',
  discount_type text not null default 'percent' check (discount_type in ('percent', 'amount')),
  discount_value numeric(10, 2) not null,
  min_order numeric(10, 2) default 0,
  active boolean default true,
  created_at timestamptz default now()
);
create table if not exists loyalty_accounts (
  phone text primary key,
  points int not null default 0,
  updated_at timestamptz default now()
);
create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  phone text not null,
  party_size int not null check (party_size >= 1),
  reserved_for timestamptz not null,
  notes text default '',
  status text not null default 'pending' check (status in ('pending', 'seated', 'cancelled', 'completed')),
  created_at timestamptz default now()
);
`.trim();

export async function POST() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    return NextResponse.json(
      {
        error: "missing_db_url",
        message:
          "Add SUPABASE_DB_URL to .env.local (Supabase → Settings → Database → Connection string → URI), then try again.",
        sql: MIGRATION_SQL,
      },
      { status: 400 }
    );
  }

  try {
    const { default: pg } = await import("pg");
    const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();
    await client.query(MIGRATION_SQL);
    await client.end();

    return NextResponse.json({ ok: true, message: "Database updated successfully" });
  } catch (err) {
    return NextResponse.json({ error: formatSupabaseError(err), sql: MIGRATION_SQL }, { status: 500 });
  }
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ needsMigration: true, sql: MIGRATION_SQL });
  }

  try {
    const supabase = createServerClient();
    const { error: phoneError } = await supabase.from("orders").select("customer_phone").limit(1);
    const { error: emailError } = await supabase.from("orders").select("customer_email").limit(1);
    const { error: otpError } = await supabase.from("otp_verifications").select("id").limit(1);
    const { error: tablesError } = await supabase.from("cafe_tables").select("id").limit(1);

    const needsMigration =
      (!!phoneError &&
        (phoneError.message.includes("customer_phone") ||
          phoneError.message.includes("schema cache"))) ||
      (!!emailError &&
        (emailError.message.includes("customer_email") ||
          emailError.message.includes("schema cache"))) ||
      (!!otpError &&
        (otpError.message.includes("otp_verifications") ||
          otpError.message.includes("schema cache"))) ||
      (!!tablesError &&
        (tablesError.message.includes("cafe_tables") ||
          tablesError.message.includes("schema cache")));

    return NextResponse.json({ needsMigration, sql: MIGRATION_SQL });
  } catch {
    return NextResponse.json({ needsMigration: true, sql: MIGRATION_SQL });
  }
}

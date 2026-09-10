-- ============================================================
-- NEW PROJECT ONLY — first time setup (empty database)
-- If you get "already exists" errors, your DB is set up.
-- For phone column only, run: add-customer-phone.sql
-- ============================================================

create table if not exists menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int default 0
);

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references menu_categories(id) on delete set null,
  name text not null,
  description text default '',
  price numeric(10, 2) not null,
  image_url text,
  available boolean default true,
  created_at timestamptz default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  table_number int not null,
  customer_name text,
  customer_phone text,
  customer_email text,
  status text default 'new' check (status in ('new', 'preparing', 'served', 'cancelled')),
  total numeric(10, 2) not null,
  created_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade not null,
  item_name text not null,
  item_price numeric(10, 2) not null,
  quantity int not null check (quantity > 0)
);

create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists orders_table_number_idx on orders (table_number);
create index if not exists orders_status_idx on orders (status);
create index if not exists orders_customer_phone_idx on orders (customer_phone);
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
  session_id uuid default gen_random_uuid(),
  created_at timestamptz default now()
);

create index if not exists cafe_tables_number_idx on cafe_tables (table_number);

create table if not exists cafe_settings (
  id int primary key default 1 check (id = 1),
  app_name text not null default 'Teakuzz',
  logo_url text default '/teakuzz-logo.png',
  tagline text default 'Crafted to Refresh',
  theme jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

insert into cafe_settings (id, app_name, logo_url, tagline)
values (1, 'Teakuzz', '/teakuzz-logo.png', 'Crafted to Refresh')
on conflict (id) do nothing;

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
create index if not exists table_requests_table_idx on table_requests (table_number, status);

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
create index if not exists reservations_when_idx on reservations (reserved_for);
create index if not exists reservations_status_idx on reservations (status);

-- Printed Teakuzz menu (categories + items) is in supabase/seed-teakuzz-menu.sql.
-- Run that file after this schema to load or replace the menu.

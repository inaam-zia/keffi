-- ============================================================
-- Teakuzz — full database setup (safe to re-run)
-- Paste into Supabase SQL Editor → Run
-- Then: npm run seed:menu
-- ============================================================

-- Core tables
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

alter table menu_items add column if not exists image_url text;

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

alter table orders add column if not exists customer_phone text;
alter table orders add column if not exists customer_email text;

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

alter table cafe_tables add column if not exists session_id uuid default gen_random_uuid();
alter table cafe_tables add column if not exists qr_token text;
alter table cafe_tables add column if not exists label text default '';
alter table cafe_tables add column if not exists notes text default '';

create index if not exists cafe_tables_number_idx on cafe_tables (table_number);
create unique index if not exists cafe_tables_qr_token_uidx
  on cafe_tables (qr_token)
  where qr_token is not null;

update cafe_tables set session_id = gen_random_uuid() where session_id is null;

insert into cafe_tables (table_number, enabled, qr_token)
select v.n, true, replace(gen_random_uuid()::text, '-', '')
from generate_series(1, 7) as v(n)
where not exists (select 1 from cafe_tables);

-- Backfill tokens for any existing tables that still lack one
update cafe_tables
set qr_token = replace(gen_random_uuid()::text, '-', '')
where qr_token is null;

update cafe_tables
set label = 'Table ' || table_number::text
where coalesce(trim(label), '') = '';

create table if not exists cafe_settings (
  id int primary key default 1 check (id = 1),
  app_name text not null default 'Teakuzz',
  logo_url text default '/teakuzz-logo.png',
  tagline text default 'Crafted to Refresh',
  theme jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table cafe_settings add column if not exists gst_enabled boolean not null default false;
alter table cafe_settings add column if not exists gstin text;
alter table cafe_settings add column if not exists gst_percent numeric(5,2) not null default 0;
alter table cafe_settings add column if not exists cgst_percent numeric(5,2) not null default 0;
alter table cafe_settings add column if not exists sgst_percent numeric(5,2) not null default 0;
alter table cafe_settings add column if not exists admin_password_hash text;
alter table cafe_settings add column if not exists payment_qr_password_hash text;

insert into cafe_settings (id, app_name, logo_url, tagline)
values (1, 'Teakuzz', '/teakuzz-logo.png', 'Crafted to Refresh')
on conflict (id) do nothing;

update cafe_settings
set
  app_name = 'Teakuzz',
  tagline = 'Crafted to Refresh',
  logo_url = coalesce(nullif(logo_url, ''), '/teakuzz-logo.png'),
  theme = jsonb_set(coalesce(theme, '{}'::jsonb), '{fontFamily}', '"open-sans"'),
  updated_at = now()
where id = 1;

update cafe_settings
set
  cgst_percent = round((coalesce(gst_percent, 0) / 2)::numeric, 2),
  sgst_percent = round((coalesce(gst_percent, 0) / 2)::numeric, 2)
where coalesce(gst_percent, 0) > 0
  and coalesce(cgst_percent, 0) = 0
  and coalesce(sgst_percent, 0) = 0;

-- Offers
create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  price numeric(10, 2) not null check (price >= 0),
  image_url text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

create table if not exists offer_items (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid references offers(id) on delete cascade not null,
  menu_item_id uuid references menu_items(id) on delete cascade not null,
  quantity int not null check (quantity > 0),
  unique (offer_id, menu_item_id)
);

create index if not exists offers_active_idx on offers (active, sort_order);
create index if not exists offer_items_offer_id_idx on offer_items (offer_id);

-- Inventory
create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null default 'pcs',
  quantity numeric(12, 3) not null default 0,
  low_stock_threshold numeric(12, 3) not null default 0,
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists inventory_items_name_lower_idx
  on inventory_items (lower(trim(name)));
create index if not exists inventory_items_quantity_idx on inventory_items (quantity);

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid references menu_items(id) on delete cascade not null unique,
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references recipes(id) on delete cascade not null,
  inventory_item_id uuid references inventory_items(id) on delete restrict not null,
  quantity_needed numeric(12, 3) not null check (quantity_needed > 0),
  unique (recipe_id, inventory_item_id)
);

create index if not exists recipe_ingredients_recipe_id_idx on recipe_ingredients (recipe_id);
create index if not exists recipe_ingredients_inventory_item_id_idx on recipe_ingredients (inventory_item_id);

create table if not exists inventory_deductions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade not null,
  inventory_item_id uuid references inventory_items(id) on delete cascade not null,
  quantity numeric(12, 3) not null check (quantity > 0),
  created_at timestamptz default now()
);

create index if not exists inventory_deductions_order_id_idx on inventory_deductions (order_id);

-- Feedback
create table if not exists dish_feedback (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade not null,
  order_item_id uuid references order_items(id) on delete cascade not null unique,
  item_name text not null,
  rating int not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now()
);

create index if not exists dish_feedback_item_name_idx on dish_feedback (item_name);
create index if not exists dish_feedback_order_id_idx on dish_feedback (order_id);
create index if not exists dish_feedback_created_at_idx on dish_feedback (created_at desc);

-- Payment QR
create table if not exists payment_qr_codes (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  label text not null default '',
  is_active boolean not null default false,
  created_at timestamptz default now()
);

alter table payment_qr_codes add column if not exists upi_id text;
alter table payment_qr_codes add column if not exists payee_name text;

create unique index if not exists payment_qr_codes_one_active_idx
  on payment_qr_codes (is_active)
  where is_active = true;

-- Storage buckets
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read branding assets" on storage.objects;
create policy "Public read branding assets"
on storage.objects for select
using (bucket_id = 'branding');

drop policy if exists "Public read menu images" on storage.objects;
create policy "Public read menu images"
on storage.objects for select
using (bucket_id = 'menu-images');

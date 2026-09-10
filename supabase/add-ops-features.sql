-- Free ops features: waiter calls, notes, dietary tags, Hindi names,
-- coupons, loyalty, reservations, busy mode, Wi-Fi, staff roles, payment method.

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

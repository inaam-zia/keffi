-- Run in Supabase SQL Editor
create table if not exists cafe_settings (
  id int primary key default 1 check (id = 1),
  app_name text not null default 'Keffi',
  logo_url text,
  tagline text default 'Crafted to Refresh',
  theme jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

insert into cafe_settings (id, app_name, tagline)
values (1, 'Keffi', 'Crafted to Refresh')
on conflict (id) do nothing;

-- Public bucket for logo
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

drop policy if exists "Public read branding assets" on storage.objects;
create policy "Public read branding assets"
on storage.objects for select
using (bucket_id = 'branding');

-- Backfill opaque QR tokens so each table scan URL includes ?t=…
-- Run in Supabase SQL Editor (safe to re-run).

alter table cafe_tables add column if not exists qr_token text;

create unique index if not exists cafe_tables_qr_token_uidx
  on cafe_tables (qr_token)
  where qr_token is not null;

update cafe_tables
set qr_token = replace(gen_random_uuid()::text, '-', '')
where qr_token is null;

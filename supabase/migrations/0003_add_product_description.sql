-- Run this once against the already-provisioned Shopnix Supabase project
-- (Project -> SQL Editor -> New query -> paste this file -> Run) to add a
-- product details column. Safe to re-run: `add column if not exists` is
-- idempotent.
--
-- Why: the upcoming product details page (consumer + admin) needs real body
-- copy beyond the existing card-level fields (name/price/old_price/
-- category_slug/img/rating/reviews/flash/sold/stock). Nullable, no default --
-- consistent with how `old_price` is already a nullable numeric column; no
-- RLS changes needed since the existing "public read products" (select) and
-- "admin manage products" (all) policies are row-level and already cover
-- every column on the table, including this new one.

alter table products add column if not exists description text;

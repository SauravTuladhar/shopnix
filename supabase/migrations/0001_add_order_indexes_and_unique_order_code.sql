-- Run this once against the already-provisioned Shopnix Supabase project
-- (Project -> SQL Editor -> New query -> paste this file -> Run) to bring
-- it in line with the indexes/constraint added to supabase/schema.sql.
-- Safe to re-run: every statement is idempotent (`if not exists`).
--
-- Why: cart_items/wishlist_items/orders/order_items/profiles aren't used by
-- the frontend yet (catalog-only migration so far), but their RLS policies
-- filter by user_id/order_id, and Postgres doesn't auto-index FK columns
-- (only PKs) -- so this is cheap now and avoids a real cost once those
-- tables see traffic in a future phase. orders.order_code is a user-facing
-- order number and had no uniqueness constraint.

create index if not exists orders_user_id_idx on orders(user_id);
create index if not exists order_items_order_id_idx on order_items(order_id);

-- Postgres has no `ADD CONSTRAINT IF NOT EXISTS`; guard manually.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'orders_order_code_key') then
    alter table orders add constraint orders_order_code_key unique (order_code);
  end if;
end $$;

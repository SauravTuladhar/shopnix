-- Adds a product_images child table so each product can have extra gallery
-- photos beyond its single required products.img "cover" image. Mirrors the
-- orders/order_items one-to-many pattern (uuid pk, FK with on delete
-- cascade, explicit index on the FK column -- Postgres doesn't auto-index
-- FK columns, only PKs). Unlike order_items, there's no owning user here,
-- so RLS mirrors products' own simpler "public read" + "admin manage"
-- policies instead of the user-scoped orders/order_items policies.
-- Append-only in v1: no sort_order column, gallery is always rendered in
-- created_at order, no reordering UI. No storage cleanup on delete --
-- orphaned files in the product-images bucket are an accepted tradeoff,
-- same as how the single-cover-image feature already handles replacement.
-- Safe to re-run: every statement is idempotent.

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references products(id) on delete cascade,
  url text not null,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_id_idx on product_images(product_id);

alter table product_images enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'product_images' and policyname = 'public read product gallery') then
    create policy "public read product gallery" on product_images for select using (true);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'product_images' and policyname = 'admin manage product gallery') then
    create policy "admin manage product gallery" on product_images for all
      using (exists (select 1 from profiles where id = auth.uid() and is_admin))
      with check (exists (select 1 from profiles where id = auth.uid() and is_admin));
  end if;
end $$;

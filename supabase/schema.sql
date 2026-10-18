-- Shopnix database schema, Row Level Security policies, and seed data.
-- Run this once, in full, in your Supabase project's SQL Editor
-- (Project -> SQL Editor -> New query -> paste this entire file -> Run).
-- Safe to re-run on a fresh project; it is NOT safe to re-run on a project
-- that already has these tables (the seed inserts would duplicate/conflict).

create extension if not exists pgcrypto;

-- ===================== TABLES =====================

create table categories (
  slug text primary key,
  label text not null,
  icon text not null,
  sort_order int not null
);

create table products (
  id text primary key,
  name text not null,
  price numeric not null,
  old_price numeric,
  category_slug text not null references categories(slug),
  img text not null,
  rating numeric not null,
  reviews int not null,
  flash boolean not null default false,
  sold int
);

-- One row per auth.users row; created automatically by the trigger below.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null
);

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references products(id),
  qty int not null check (qty > 0),
  unique (user_id, product_id)
);

create table wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references products(id),
  unique (user_id, product_id)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  status text not null default 'Processing',
  total numeric not null,
  name text not null,
  phone text not null,
  address text not null,
  payment_method text not null
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id text not null references products(id),
  qty int not null,
  price_at_purchase numeric not null
);

-- ===================== AUTO-CREATE PROFILE ON SIGNUP =====================
-- The frontend passes { data: { name } } to supabase.auth.signUp(); this
-- trigger copies that into profiles the moment the auth.users row exists,
-- so there's no client-side race between "user created" and "profile created".

create function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ===================== ROW LEVEL SECURITY =====================
-- Everything is denied by default once RLS is enabled; each policy below is
-- an explicit exception. There is no admin UI in this app, so categories/
-- products get read-only policies (edit them from the dashboard if needed).

alter table categories enable row level security;
alter table products enable row level security;
alter table profiles enable row level security;
alter table cart_items enable row level security;
alter table wishlist_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "public read categories" on categories for select using (true);
create policy "public read products" on products for select using (true);

create policy "read own profile" on profiles for select using (auth.uid() = id);

create policy "manage own cart" on cart_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "manage own wishlist" on wishlist_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "read own orders" on orders for select using (auth.uid() = user_id);
create policy "insert own orders" on orders for insert with check (auth.uid() = user_id);

create policy "read own order items" on order_items for select
  using (exists (select 1 from orders o where o.id = order_items.order_id and o.user_id = auth.uid()));
create policy "insert own order items" on order_items for insert
  with check (exists (select 1 from orders o where o.id = order_items.order_id and o.user_id = auth.uid()));

-- ===================== SEED DATA =====================
-- Mirrors the CATEGORIES/PRODUCTS arrays previously hardcoded in js/products.js.

-- Categories (sort_order preserves original array order)
insert into categories (slug, label, icon, sort_order) values
  ('electronics', 'Electronics', '📱', 0),
  ('mens-fashion', 'Men''s Fashion', '👕', 1),
  ('womens-fashion', 'Women''s Fashion', '👗', 2),
  ('home', 'Home & Living', '🏠', 3),
  ('beauty', 'Health & Beauty', '💄', 4),
  ('sports', 'Sports & Outdoor', '🏃', 5),
  ('toys', 'Toys & Baby', '🧸', 6);

-- Products
insert into products (id, name, price, old_price, category_slug, img, rating, reviews, flash, sold) values
  ('wireless-earbuds-pro', 'Wireless Earbuds Pro', 2499, 4000, 'electronics', 'https://placehold.co/300x300/0f6e5f/ffffff?text=Earbuds', 4, 214, true, 72),
  ('smart-fitness-watch', 'Smart Fitness Watch', 3899, 5200, 'electronics', 'https://placehold.co/300x300/ff6b5b/ffffff?text=Smartwatch', 5, 98, true, 45),
  ('bluetooth-speaker', 'Bluetooth Speaker', 2299, NULL, 'electronics', 'https://placehold.co/300x300/374151/ffffff?text=Speaker', 4, 620, false, NULL),
  ('4k-smart-tv-43', '4K Smart TV 43''''', 34999, NULL, 'electronics', 'https://placehold.co/300x300/0f6e5f/ffffff?text=Smart+TV', 4, 214, false, NULL),
  ('laptop-ultraslim-14', 'Laptop UltraSlim 14"', 62999, 69999, 'electronics', 'https://placehold.co/300x300/13997f/ffffff?text=Laptop', 5, 132, false, NULL),
  ('smart-home-camera', 'Smart Home Camera', 3299, NULL, 'electronics', 'https://placehold.co/300x300/ffb400/ffffff?text=Camera', 4, 187, false, NULL),
  ('mens-denim-jacket', 'Men''s Denim Jacket', 2499, NULL, 'mens-fashion', 'https://placehold.co/300x300/374151/ffffff?text=Jacket', 5, 89, false, NULL),
  ('mens-leather-belt', 'Men''s Leather Belt', 899, 1200, 'mens-fashion', 'https://placehold.co/300x300/1f2937/ffffff?text=Belt', 4, 56, false, NULL),
  ('running-shoes-air-x', 'Running Shoes Air-X', 3299, 4100, 'mens-fashion', 'https://placehold.co/300x300/374151/ffffff?text=Shoes', 4, 301, true, 60),
  ('backpack-urban-20l', 'Backpack Urban 20L', 2199, 3300, 'mens-fashion', 'https://placehold.co/300x300/e14a39/ffffff?text=Backpack', 4, 144, true, 95),
  ('womens-tote-bag', 'Women''s Tote Bag', 1699, NULL, 'womens-fashion', 'https://placehold.co/300x300/13997f/ffffff?text=Tote+Bag', 4, 154, false, NULL),
  ('womens-summer-dress', 'Women''s Summer Dress', 1999, 2800, 'womens-fashion', 'https://placehold.co/300x300/ff6b5b/ffffff?text=Dress', 5, 210, false, NULL),
  ('ceramic-cookware-set', 'Ceramic Cookware Set', 4599, 6500, 'home', 'https://placehold.co/300x300/ffb400/ffffff?text=Cookware', 4, 77, true, 88),
  ('memory-foam-pillow', 'Memory Foam Pillow', 999, NULL, 'home', 'https://placehold.co/300x300/13997f/ffffff?text=Pillow', 4, 502, false, NULL),
  ('led-desk-lamp', 'LED Desk Lamp', 1299, NULL, 'home', 'https://placehold.co/300x300/ffb400/ffffff?text=Lamp', 4, 98, false, NULL),
  ('cotton-bedsheet-set', 'Cotton Bedsheet Set', 1899, 2400, 'home', 'https://placehold.co/300x300/0f6e5f/ffffff?text=Bedsheet', 5, 230, false, NULL),
  ('portable-blender', 'Portable Blender', 1599, 1900, 'home', 'https://placehold.co/300x300/13997f/ffffff?text=Blender', 4, 66, true, 30),
  ('vitamin-c-serum', 'Vitamin C Serum', 799, NULL, 'beauty', 'https://placehold.co/300x300/ffb400/ffffff?text=Serum', 5, 1240, false, NULL),
  ('hair-dryer-1800w', 'Hair Dryer 1800W', 2399, NULL, 'beauty', 'https://placehold.co/300x300/e14a39/ffffff?text=Hair+Dryer', 5, 411, false, NULL),
  ('matte-lipstick-set', 'Matte Lipstick Set', 1299, 1800, 'beauty', 'https://placehold.co/300x300/ff6b5b/ffffff?text=Lipstick', 4, 320, false, NULL),
  ('herbal-shampoo-500ml', 'Herbal Shampoo 500ml', 549, NULL, 'beauty', 'https://placehold.co/300x300/13997f/ffffff?text=Shampoo', 4, 189, false, NULL),
  ('yoga-mat-6mm', 'Yoga Mat 6mm', 1199, NULL, 'sports', 'https://placehold.co/300x300/e14a39/ffffff?text=Yoga+Mat', 4, 76, false, NULL),
  ('adjustable-dumbbells', 'Adjustable Dumbbells', 4999, NULL, 'sports', 'https://placehold.co/300x300/0f6e5f/ffffff?text=Dumbbells', 4, 63, false, NULL),
  ('cycling-helmet', 'Cycling Helmet', 1799, 2200, 'sports', 'https://placehold.co/300x300/374151/ffffff?text=Helmet', 4, 52, false, NULL),
  ('badminton-racket-set', 'Badminton Racket Set', 1499, NULL, 'sports', 'https://placehold.co/300x300/13997f/ffffff?text=Racket', 5, 140, false, NULL),
  ('building-blocks-set', 'Building Blocks Set', 1899, NULL, 'toys', 'https://placehold.co/300x300/0f6e5f/ffffff?text=Blocks', 5, 340, false, NULL),
  ('remote-control-car', 'Remote Control Car', 2599, NULL, 'toys', 'https://placehold.co/300x300/374151/ffffff?text=RC+Car', 5, 287, false, NULL),
  ('plush-teddy-bear', 'Plush Teddy Bear', 799, NULL, 'toys', 'https://placehold.co/300x300/ff6b5b/ffffff?text=Teddy+Bear', 5, 410, false, NULL),
  ('educational-puzzle-set', 'Educational Puzzle Set', 699, 900, 'toys', 'https://placehold.co/300x300/ffb400/ffffff?text=Puzzle', 4, 95, false, NULL);

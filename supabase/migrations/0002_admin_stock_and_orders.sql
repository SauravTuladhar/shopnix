-- Run this once against the already-provisioned Shopnix Supabase project
-- (Project -> SQL Editor -> New query -> paste this file -> Run) to add admin
-- support, product stock tracking, and a safe way for checkout to create
-- real orders. Safe to re-run: every statement is idempotent.
--
-- Why: the admin dashboard needs (a) a way to tell admin accounts apart from
-- regular customers, (b) a stock quantity on products it can manage and the
-- storefront can respect, and (c) a way for checkout to turn a cart into a
-- real `orders`/`order_items` row without letting a client forge `user_id`
-- or write to `products.stock` directly (regular users get no UPDATE grant
-- on products at all -- place_order() is SECURITY DEFINER specifically so
-- the stock decrement + order insert can happen atomically on the server).
--
-- Manual step after running this: there's no self-serve admin signup. Sign
-- up a normal account through the storefront, find its id (Authentication ->
-- Users, or `select id from auth.users where email = '...'`), then run:
--   update profiles set is_admin = true where id = '<that uuid>';

alter table profiles add column if not exists is_admin boolean not null default false;
alter table products add column if not exists stock int not null default 100;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'products' and policyname = 'admin manage products') then
    create policy "admin manage products" on products for all
      using (exists (select 1 from profiles where id = auth.uid() and is_admin))
      with check (exists (select 1 from profiles where id = auth.uid() and is_admin));
  end if;

  if not exists (select 1 from pg_policies where tablename = 'orders' and policyname = 'admin read all orders') then
    create policy "admin read all orders" on orders for select
      using (exists (select 1 from profiles where id = auth.uid() and is_admin));
  end if;

  if not exists (select 1 from pg_policies where tablename = 'orders' and policyname = 'admin update orders') then
    create policy "admin update orders" on orders for update
      using (exists (select 1 from profiles where id = auth.uid() and is_admin));
  end if;

  if not exists (select 1 from pg_policies where tablename = 'order_items' and policyname = 'admin read all order items') then
    create policy "admin read all order items" on order_items for select
      using (exists (select 1 from profiles where id = auth.uid() and is_admin));
  end if;
end $$;

-- Turns a cart into a real order: validates stock, inserts the order + its
-- items at current price, decrements stock, and returns the new order_code.
-- SECURITY DEFINER so it can decrement products.stock (regular users have no
-- UPDATE grant on products); user_id is always auth.uid(), never trusted
-- from the caller, so this can't be used to place an order as someone else.
create or replace function place_order(
  items jsonb, -- [{"id": "product-id", "qty": 2}, ...]
  p_name text,
  p_phone text,
  p_address text,
  p_payment_method text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_order_code text;
  v_total numeric := 0;
  v_item record;
  v_price numeric;
  v_stock int;
begin
  if v_user_id is null then
    raise exception 'Must be logged in to place an order';
  end if;
  if jsonb_array_length(items) = 0 then
    raise exception 'Cart is empty';
  end if;

  -- Validate stock up front so we fail before writing anything.
  for v_item in select (e->>'id') as id, (e->>'qty')::int as qty from jsonb_array_elements(items) e
  loop
    select price, stock into v_price, v_stock from products where id = v_item.id for update;
    if v_price is null then
      raise exception 'Product % no longer exists', v_item.id;
    end if;
    if v_stock < v_item.qty then
      raise exception 'Not enough stock for %: only % left', v_item.id, v_stock;
    end if;
    v_total := v_total + v_price * v_item.qty;
  end loop;

  v_order_code := 'SPX-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into orders (order_code, user_id, total, name, phone, address, payment_method)
  values (v_order_code, v_user_id, v_total, p_name, p_phone, p_address, p_payment_method)
  returning id into v_order_id;

  for v_item in select (e->>'id') as id, (e->>'qty')::int as qty from jsonb_array_elements(items) e
  loop
    select price into v_price from products where id = v_item.id;
    insert into order_items (order_id, product_id, qty, price_at_purchase)
    values (v_order_id, v_item.id, v_item.qty, v_price);
    update products set stock = stock - v_item.qty where id = v_item.id;
  end loop;

  return v_order_code;
end;
$$;

grant execute on function place_order(jsonb, text, text, text, text) to authenticated;

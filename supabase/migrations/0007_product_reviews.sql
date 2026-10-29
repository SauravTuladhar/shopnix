-- Adds a product_reviews table so signed-in customers can leave a rating +
-- written review on products they've actually purchased, and makes
-- products.rating/products.reviews auto-computed from real reviews via a
-- trigger instead of admin-editable raw numbers.
--
-- Gating rule: review INSERT is restricted to users with at least one
-- order_items row for this product on an order that is NOT 'Cancelled'
-- (i.e. Processing/Shipped/Delivered all qualify), rather than requiring
-- status = 'Delivered'. Justification: this app has no courier integration
-- -- order status only advances when an admin manually updates it from the
-- dashboard -- so requiring Delivered would gate a legitimate first-time
-- buyer's review behind that manual housekeeping rather than anything
-- about genuine purchase. Excluding only Cancelled still blocks the real
-- abuse case (reviewing something ordered but never received because it
-- was cancelled). Safe to re-run: table/index creation guarded with IF NOT
-- EXISTS, policies/trigger guarded manually.

create table if not exists product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reviewer_name text not null,
  rating int not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create index if not exists product_reviews_product_id_idx on product_reviews(product_id);

alter table product_reviews enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'product_reviews' and policyname = 'public read reviews') then
    create policy "public read reviews" on product_reviews for select using (true);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'product_reviews' and policyname = 'verified purchaser insert review') then
    create policy "verified purchaser insert review" on product_reviews for insert
      with check (
        auth.uid() = user_id
        and exists (
          select 1 from order_items oi
          join orders o on o.id = oi.order_id
          where oi.product_id = product_reviews.product_id
            and o.user_id = auth.uid()
            and o.status <> 'Cancelled'
        )
      );
  end if;

  if not exists (select 1 from pg_policies where tablename = 'product_reviews' and policyname = 'manage own review') then
    create policy "manage own review" on product_reviews for update
      using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'product_reviews' and policyname = 'delete own review') then
    create policy "delete own review" on product_reviews for delete
      using (auth.uid() = user_id);
  end if;
end $$;

-- ===== auto-recompute products.rating / products.reviews =====
-- Only fires on actual product_reviews mutations -- existing seeded
-- rating/reviews values on products with zero real reviews are left
-- untouched (no backfill/zero-out on migration day).
create or replace function recompute_product_rating()
returns trigger as $$
declare
  v_product_id text := coalesce(new.product_id, old.product_id);
begin
  update products set
    rating = coalesce((select round(avg(rating)::numeric, 1) from product_reviews where product_id = v_product_id), rating),
    reviews = (select count(*) from product_reviews where product_id = v_product_id)
  where id = v_product_id;
  return null;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_product_review_change on product_reviews;
create trigger on_product_review_change
  after insert or update or delete on product_reviews
  for each row execute function recompute_product_rating();

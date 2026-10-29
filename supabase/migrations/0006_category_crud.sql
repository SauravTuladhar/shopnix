-- Adds the write-side RLS policy categories was missing: the schema always
-- had "public read categories" but no admin-write policy, because there was
-- no admin UI for categories until now. Mirrors "admin manage products"
-- exactly. Safe to re-run: the policy-create is guarded manually.
--
-- Note: products.category_slug references categories(slug) with no ON
-- DELETE clause, so Postgres defaults to NO ACTION/RESTRICT -- deleting a
-- category that's still referenced by any product fails with a foreign-key
-- violation (error.code === '23503'). The admin UI catches that and shows a
-- specific message rather than a raw error.

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'categories' and policyname = 'admin manage categories') then
    create policy "admin manage categories" on categories for all
      using (exists (select 1 from profiles where id = auth.uid() and is_admin))
      with check (exists (select 1 from profiles where id = auth.uid() and is_admin));
  end if;
end $$;

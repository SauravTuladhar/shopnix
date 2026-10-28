-- Adds a "product-images" Storage bucket for the admin dashboard's new
-- image-upload control (alongside the existing paste-a-URL field). Public
-- bucket (product photos are public-facing); writes are gated to admins via
-- the same profiles.is_admin pattern used elsewhere in this schema.
-- Safe to re-run: bucket upsert via ON CONFLICT, policies guarded manually
-- (Postgres has no CREATE POLICY IF NOT EXISTS).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'admin manage product images'
  ) then
    create policy "admin manage product images" on storage.objects for all
      using (bucket_id = 'product-images' and exists (select 1 from profiles where id = auth.uid() and is_admin))
      with check (bucket_id = 'product-images' and exists (select 1 from profiles where id = auth.uid() and is_admin));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'public read product images'
  ) then
    create policy "public read product images" on storage.objects for select
      using (bucket_id = 'product-images');
  end if;
end $$;

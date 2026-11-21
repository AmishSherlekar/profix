-- ============================================================================
-- ProFix — Supabase Storage Buckets Configuration & Security Policies
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Create the storage buckets if they do not exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('professional-docs', 'professional-docs', false, 5242880, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. Avatars Bucket Policies
-- Public read for avatars
create policy "Avatars are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Authenticated users can upload their own avatar into folder named after their user id
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can update/replace their own avatar
create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can delete their own avatar
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Professional Documents Bucket Policies
-- Owners and admins can view documents
create policy "Document owner and admin can view professional documents"
  on storage.objects for select
  using (
    bucket_id = 'professional-docs'
    and auth.role() = 'authenticated'
    and (
      (storage.foldername(name))[1] in (
        select id::text from public.professional_profiles where user_id = auth.uid()
      )
      or exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
      )
    )
  );

-- Professionals can upload into their own professional_profile id folder
create policy "Professionals can upload certificates"
  on storage.objects for insert
  with check (
    bucket_id = 'professional-docs'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] in (
      select id::text from public.professional_profiles where user_id = auth.uid()
    )
  );

-- Admins or owner can delete documents if needed
create policy "Professionals or admin can delete certificates"
  on storage.objects for delete
  using (
    bucket_id = 'professional-docs'
    and auth.role() = 'authenticated'
    and (
      (storage.foldername(name))[1] in (
        select id::text from public.professional_profiles where user_id = auth.uid()
      )
      or exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
      )
    )
  );

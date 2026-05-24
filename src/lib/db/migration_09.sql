-- KlinikAid Migration 09: Storage Bucket & RLS Policies
-- Target DB: Supabase Postgres (Storage schema)

-- 1. Create the private bucket 'patient-documents' if it doesn't exist
insert into storage.buckets (id, name, public)
values ('patient-documents', 'patient-documents', false)
on conflict (id) do nothing;

-- 2. Enable RLS on storage.objects (Supabase enables this by default, owner only)
-- alter table storage.objects enable row level security;

-- 3. Storage Policies

-- Drop existing policies on patient-documents to avoid conflict
drop policy if exists "Allow patient upload own files" on storage.objects;
drop policy if exists "Allow patient read own files" on storage.objects;
drop policy if exists "Allow staff and admin read all patient files" on storage.objects;
drop policy if exists "Allow patient delete own pending files" on storage.objects;

-- Allow authenticated patients to upload files only to their own directory prefix (auth.uid())
create policy "Allow patient upload own files"
  on storage.objects for insert
  with check (
    bucket_id = 'patient-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated patients to read files only under their own directory prefix
create policy "Allow patient read own files"
  on storage.objects for select
  using (
    bucket_id = 'patient-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow clinic staff and admins to read all patient document files
create policy "Allow staff and admin read all patient files"
  on storage.objects for select
  using (
    bucket_id = 'patient-documents' AND
    public.get_auth_user_role() in ('admin', 'receptionist')
  );

-- Allow authenticated patients to delete files under their own directory prefix
create policy "Allow patient delete own pending files"
  on storage.objects for delete
  using (
    bucket_id = 'patient-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

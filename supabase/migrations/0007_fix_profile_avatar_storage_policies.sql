insert into storage.buckets (id, name, public)
values ('profile-avatars', 'profile-avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "users upload own avatars" on storage.objects;
drop policy if exists "users update own avatars" on storage.objects;
drop policy if exists "users delete own avatars" on storage.objects;
drop policy if exists "authenticated users upload profile avatars" on storage.objects;
drop policy if exists "users update own profile avatars" on storage.objects;
drop policy if exists "users delete own profile avatars" on storage.objects;

create policy "authenticated users upload profile avatars"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
);

create policy "users update own profile avatars"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and owner = auth.uid()
)
with check (
  bucket_id = 'profile-avatars'
  and owner = auth.uid()
);

create policy "users delete own profile avatars"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and owner = auth.uid()
);

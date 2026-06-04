drop policy if exists "public can view profile avatars" on storage.objects;

create policy "public can view profile avatars"
on storage.objects for select
to public
using (
  bucket_id = 'profile-avatars'
);

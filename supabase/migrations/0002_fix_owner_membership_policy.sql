create or replace function public.is_pelada_creator(target_pelada_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.peladas p
    where p.id = target_pelada_id
      and p.created_by = target_user_id
  );
$$;

revoke all on function public.is_pelada_creator(uuid, uuid) from public;
grant execute on function public.is_pelada_creator(uuid, uuid) to authenticated;

drop policy if exists "creator inserts owner membership" on public.pelada_members;

create policy "creator inserts owner membership"
on public.pelada_members for insert
to authenticated
with check (
  (user_id = auth.uid() and role = 'owner' and public.is_pelada_creator(pelada_id))
  or public.has_pelada_role(pelada_id, array['owner','admin']::public.member_role[])
);

insert into public.pelada_members (pelada_id, user_id, role)
select p.id, p.created_by, 'owner'::public.member_role
from public.peladas p
where not exists (
  select 1
  from public.pelada_members pm
  where pm.pelada_id = p.id
    and pm.user_id = p.created_by
)
on conflict (pelada_id, user_id) do nothing;

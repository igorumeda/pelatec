create or replace function public.can_request_pelada_join(target_pelada_id uuid, target_user_id uuid default auth.uid())
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
      and p.is_public = true
      and p.status = 'active'
  )
  and not public.is_pelada_member(target_pelada_id, target_user_id);
$$;

revoke all on function public.can_request_pelada_join(uuid, uuid) from public;
grant execute on function public.can_request_pelada_join(uuid, uuid) to authenticated;

drop policy if exists "users create own join requests" on public.pelada_join_requests;

create policy "users create own join requests"
on public.pelada_join_requests for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
  and public.can_request_pelada_join(pelada_id)
);

drop policy if exists "users resubmit rejected join requests" on public.pelada_join_requests;

create policy "users resubmit rejected join requests"
on public.pelada_join_requests for update
to authenticated
using (
  user_id = auth.uid()
  and status = 'rejected'
  and public.can_request_pelada_join(pelada_id)
)
with check (
  user_id = auth.uid()
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
  and public.can_request_pelada_join(pelada_id)
);

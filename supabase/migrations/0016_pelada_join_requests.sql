create table if not exists public.pelada_join_requests (
  id uuid primary key default gen_random_uuid(),
  pelada_id uuid not null references public.peladas(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pelada_id, user_id)
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pelada_join_requests_updated_at on public.pelada_join_requests;

create trigger pelada_join_requests_updated_at before update on public.pelada_join_requests
for each row execute function public.touch_updated_at();

alter table public.pelada_join_requests enable row level security;

grant select, insert, update on public.pelada_join_requests to authenticated;

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

drop policy if exists "users view own join requests" on public.pelada_join_requests;

create policy "users view own join requests"
on public.pelada_join_requests for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "admins view pelada join requests" on public.pelada_join_requests;

create policy "admins view pelada join requests"
on public.pelada_join_requests for select
to authenticated
using (public.has_pelada_role(pelada_id, array['owner','admin']::public.member_role[]));

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

drop policy if exists "users cancel own pending join requests" on public.pelada_join_requests;

create policy "users cancel own pending join requests"
on public.pelada_join_requests for delete
to authenticated
using (
  user_id = auth.uid()
  and status = 'pending'
);

drop policy if exists "admins review pelada join requests" on public.pelada_join_requests;

create policy "admins review pelada join requests"
on public.pelada_join_requests for update
to authenticated
using (public.has_pelada_role(pelada_id, array['owner','admin']::public.member_role[]))
with check (public.has_pelada_role(pelada_id, array['owner','admin']::public.member_role[]));

drop policy if exists "admins view join request profiles" on public.profiles;

create policy "admins view join request profiles"
on public.profiles for select
to authenticated
using (
  exists (
    select 1
    from public.pelada_join_requests pjr
    where pjr.user_id = profiles.id
      and public.has_pelada_role(pjr.pelada_id, array['owner','admin']::public.member_role[])
  )
);

create index if not exists pelada_join_requests_pelada_status_idx
on public.pelada_join_requests(pelada_id, status, created_at);

create index if not exists pelada_join_requests_user_status_idx
on public.pelada_join_requests(user_id, status);

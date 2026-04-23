create extension if not exists "pgcrypto";

create type public.member_role as enum ('owner', 'admin', 'player');
create type public.pelada_status as enum ('active', 'inactive');
create type public.round_status as enum ('scheduled', 'finished', 'cancelled');
create type public.presence_status as enum ('confirmed', 'declined', 'pending');
create type public.financial_entry_type as enum ('revenue', 'expense');
create type public.charge_status as enum ('open', 'paid', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.peladas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  city text,
  neighborhood text,
  venue text,
  preferred_weekdays text,
  default_time time,
  monthly_fee numeric(10,2),
  daily_fee numeric(10,2),
  status public.pelada_status not null default 'active',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pelada_members (
  pelada_id uuid not null references public.peladas(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'player',
  created_at timestamptz not null default now(),
  primary key (pelada_id, user_id)
);

create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  pelada_id uuid not null references public.peladas(id) on delete cascade,
  title text,
  round_date date not null,
  starts_at time not null,
  venue text,
  player_limit integer,
  notes text,
  status public.round_status not null default 'scheduled',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.round_presence (
  round_id uuid not null references public.rounds(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.presence_status not null default 'pending',
  marked_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (round_id, user_id)
);

create table public.round_teams (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id) on delete cascade,
  name text not null,
  sort_order integer not null,
  created_at timestamptz not null default now()
);

create table public.round_team_players (
  team_id uuid not null references public.round_teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (team_id, user_id)
);

create table public.round_matches (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id) on delete cascade,
  team_a_id uuid references public.round_teams(id) on delete set null,
  team_b_id uuid references public.round_teams(id) on delete set null,
  team_a_score integer,
  team_b_score integer,
  notes text,
  created_at timestamptz not null default now()
);

create table public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  pelada_id uuid not null references public.peladas(id) on delete cascade,
  type public.financial_entry_type not null,
  description text not null,
  amount numeric(10,2) not null check (amount >= 0),
  entry_date date not null default current_date,
  notes text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.player_charges (
  id uuid primary key default gen_random_uuid(),
  pelada_id uuid not null references public.peladas(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  round_id uuid references public.rounds(id) on delete set null,
  description text not null,
  competence text,
  due_date date,
  amount numeric(10,2) not null check (amount >= 0),
  status public.charge_status not null default 'open',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.player_payments (
  id uuid primary key default gen_random_uuid(),
  charge_id uuid references public.player_charges(id) on delete set null,
  pelada_id uuid not null references public.peladas(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 0),
  paid_at date not null default current_date,
  notes text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
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

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();
create trigger peladas_updated_at before update on public.peladas
for each row execute function public.touch_updated_at();
create trigger rounds_updated_at before update on public.rounds
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.email, '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_pelada_member(target_pelada_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.pelada_members pm
    where pm.pelada_id = target_pelada_id
      and pm.user_id = target_user_id
  );
$$;

create or replace function public.has_pelada_role(target_pelada_id uuid, allowed_roles public.member_role[], target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.pelada_members pm
    where pm.pelada_id = target_pelada_id
      and pm.user_id = target_user_id
      and pm.role = any(allowed_roles)
  );
$$;

create or replace function public.is_round_member(target_round_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.rounds r
    join public.pelada_members pm on pm.pelada_id = r.pelada_id
    where r.id = target_round_id
      and pm.user_id = target_user_id
  );
$$;

create or replace function public.can_manage_round(target_round_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.rounds r
    join public.pelada_members pm on pm.pelada_id = r.pelada_id
    where r.id = target_round_id
      and pm.user_id = target_user_id
      and pm.role in ('owner', 'admin')
  );
$$;

create or replace function public.find_profile_id_by_email(target_email text)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select p.id
  from public.profiles p
  where lower(p.email) = lower(target_email)
  limit 1;
$$;

revoke all on function public.find_profile_id_by_email(text) from public;
grant execute on function public.find_profile_id_by_email(text) to authenticated;

alter table public.profiles enable row level security;
alter table public.peladas enable row level security;
alter table public.pelada_members enable row level security;
alter table public.rounds enable row level security;
alter table public.round_presence enable row level security;
alter table public.round_teams enable row level security;
alter table public.round_team_players enable row level security;
alter table public.round_matches enable row level security;
alter table public.financial_entries enable row level security;
alter table public.player_charges enable row level security;
alter table public.player_payments enable row level security;

create policy "profiles are visible to shared peladas"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.pelada_members me
    join public.pelada_members other on other.pelada_id = me.pelada_id
    where me.user_id = auth.uid()
      and other.user_id = profiles.id
  )
);

create policy "users edit own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "users insert own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy "members view peladas"
on public.peladas for select
to authenticated
using (public.is_pelada_member(id));

create policy "authenticated users create peladas"
on public.peladas for insert
to authenticated
with check (created_by = auth.uid());

create policy "admins update peladas"
on public.peladas for update
to authenticated
using (public.has_pelada_role(id, array['owner','admin']::public.member_role[]))
with check (public.has_pelada_role(id, array['owner','admin']::public.member_role[]));

create policy "members view memberships"
on public.pelada_members for select
to authenticated
using (public.is_pelada_member(pelada_id));

create policy "creator inserts owner membership"
on public.pelada_members for insert
to authenticated
with check (
  (user_id = auth.uid() and role = 'owner' and exists (
    select 1 from public.peladas p where p.id = pelada_id and p.created_by = auth.uid()
  ))
  or public.has_pelada_role(pelada_id, array['owner','admin']::public.member_role[])
);

create policy "owners update member roles"
on public.pelada_members for update
to authenticated
using (public.has_pelada_role(pelada_id, array['owner']::public.member_role[]))
with check (public.has_pelada_role(pelada_id, array['owner']::public.member_role[]));

create policy "owners delete members except self owner row"
on public.pelada_members for delete
to authenticated
using (
  public.has_pelada_role(pelada_id, array['owner']::public.member_role[])
  and not (user_id = auth.uid() and role = 'owner')
);

create policy "members view rounds"
on public.rounds for select
to authenticated
using (public.is_pelada_member(pelada_id));

create policy "admins manage rounds"
on public.rounds for all
to authenticated
using (public.has_pelada_role(pelada_id, array['owner','admin']::public.member_role[]))
with check (public.has_pelada_role(pelada_id, array['owner','admin']::public.member_role[]));

create policy "members view presence"
on public.round_presence for select
to authenticated
using (public.is_round_member(round_id));

create policy "players mark own presence"
on public.round_presence for insert
to authenticated
with check (user_id = auth.uid() and public.is_round_member(round_id));

create policy "players update own presence or admins update any"
on public.round_presence for update
to authenticated
using ((user_id = auth.uid() and public.is_round_member(round_id)) or public.can_manage_round(round_id))
with check ((user_id = auth.uid() and public.is_round_member(round_id)) or public.can_manage_round(round_id));

create policy "admins insert presence"
on public.round_presence for insert
to authenticated
with check (public.can_manage_round(round_id));

create policy "members view teams"
on public.round_teams for select
to authenticated
using (public.is_round_member(round_id));

create policy "admins manage teams"
on public.round_teams for all
to authenticated
using (public.can_manage_round(round_id))
with check (public.can_manage_round(round_id));

create policy "members view team players"
on public.round_team_players for select
to authenticated
using (exists (
  select 1 from public.round_teams rt
  where rt.id = team_id and public.is_round_member(rt.round_id)
));

create policy "admins manage team players"
on public.round_team_players for all
to authenticated
using (exists (
  select 1 from public.round_teams rt
  where rt.id = team_id and public.can_manage_round(rt.round_id)
))
with check (exists (
  select 1 from public.round_teams rt
  where rt.id = team_id and public.can_manage_round(rt.round_id)
));

create policy "members view round matches"
on public.round_matches for select
to authenticated
using (public.is_round_member(round_id));

create policy "admins manage round matches"
on public.round_matches for all
to authenticated
using (public.can_manage_round(round_id))
with check (public.can_manage_round(round_id));

create policy "admins view financial entries"
on public.financial_entries for select
to authenticated
using (public.has_pelada_role(pelada_id, array['owner','admin']::public.member_role[]));

create policy "admins manage financial entries"
on public.financial_entries for all
to authenticated
using (public.has_pelada_role(pelada_id, array['owner','admin']::public.member_role[]))
with check (public.has_pelada_role(pelada_id, array['owner','admin']::public.member_role[]));

create policy "admins view charges"
on public.player_charges for select
to authenticated
using (public.has_pelada_role(pelada_id, array['owner','admin']::public.member_role[]) or user_id = auth.uid());

create policy "admins manage charges"
on public.player_charges for all
to authenticated
using (public.has_pelada_role(pelada_id, array['owner','admin']::public.member_role[]))
with check (public.has_pelada_role(pelada_id, array['owner','admin']::public.member_role[]));

create policy "admins view payments"
on public.player_payments for select
to authenticated
using (public.has_pelada_role(pelada_id, array['owner','admin']::public.member_role[]) or user_id = auth.uid());

create policy "admins manage payments"
on public.player_payments for all
to authenticated
using (public.has_pelada_role(pelada_id, array['owner','admin']::public.member_role[]))
with check (public.has_pelada_role(pelada_id, array['owner','admin']::public.member_role[]));

create index pelada_members_user_id_idx on public.pelada_members(user_id);
create index rounds_pelada_date_idx on public.rounds(pelada_id, round_date);
create index round_presence_user_id_idx on public.round_presence(user_id);
create index financial_entries_pelada_date_idx on public.financial_entries(pelada_id, entry_date);
create index player_charges_pelada_status_idx on public.player_charges(pelada_id, status);

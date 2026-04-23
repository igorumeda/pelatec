create table if not exists public.round_match_player_stats (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.round_matches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  team_id uuid references public.round_teams(id) on delete set null,
  goals_for integer not null default 0 check (goals_for >= 0),
  own_goals integer not null default 0 check (own_goals >= 0),
  created_at timestamptz not null default now()
);

alter table public.round_match_player_stats enable row level security;

create policy "members view match player stats"
on public.round_match_player_stats for select
to authenticated
using (
  exists (
    select 1
    from public.round_matches rm
    where rm.id = match_id
      and public.is_round_member(rm.round_id)
  )
);

create policy "admins manage match player stats"
on public.round_match_player_stats for all
to authenticated
using (
  exists (
    select 1
    from public.round_matches rm
    where rm.id = match_id
      and public.can_manage_round(rm.round_id)
  )
)
with check (
  exists (
    select 1
    from public.round_matches rm
    where rm.id = match_id
      and public.can_manage_round(rm.round_id)
  )
);

create index if not exists round_match_player_stats_match_idx on public.round_match_player_stats(match_id);
create index if not exists round_match_player_stats_user_idx on public.round_match_player_stats(user_id);

alter table public.rounds
add column if not exists duration_minutes integer not null default 120;

alter table public.rounds
drop constraint if exists rounds_duration_minutes_check;

alter table public.rounds
add constraint rounds_duration_minutes_check check (
  duration_minutes between 1 and 1440
);

alter table public.rounds
alter column status drop default;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'round_status_new') then
    create type public.round_status_new as enum ('active', 'cancelled');
  end if;
end $$;

alter table public.rounds
alter column status type public.round_status_new
using (
  case
    when status::text = 'cancelled' then 'cancelled'
    else 'active'
  end
)::public.round_status_new;

drop type public.round_status;

alter type public.round_status_new rename to round_status;

alter table public.rounds
alter column status set default 'active';

drop function if exists public.get_public_pelada_by_slug(text);

create function public.get_public_pelada_by_slug(target_slug text)
returns table (
  id uuid,
  name text,
  description text,
  city text,
  neighborhood text,
  venue text,
  venue_address text,
  venue_place_id text,
  venue_lat double precision,
  venue_lng double precision,
  preferred_weekdays text,
  default_time time,
  monthly_fee numeric,
  daily_fee numeric,
  status public.pelada_status,
  crest_url text,
  banner_url text,
  public_slug text,
  created_at timestamptz,
  members_count bigint,
  rounds_count bigint,
  scheduled_rounds_count bigint,
  finished_rounds_count bigint,
  average_player_quality numeric
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    p.name,
    p.description,
    p.city,
    p.neighborhood,
    p.venue,
    p.venue_address,
    p.venue_place_id,
    p.venue_lat,
    p.venue_lng,
    p.preferred_weekdays,
    p.default_time,
    p.monthly_fee,
    p.daily_fee,
    p.status,
    p.crest_url,
    p.banner_url,
    p.public_slug,
    p.created_at,
    coalesce(member_stats.members_count, 0) as members_count,
    coalesce(round_stats.rounds_count, 0) as rounds_count,
    coalesce(round_stats.scheduled_rounds_count, 0) as scheduled_rounds_count,
    coalesce(round_stats.finished_rounds_count, 0) as finished_rounds_count,
    coalesce(member_stats.average_player_quality, 0) as average_player_quality
  from public.peladas p
  left join lateral (
    select
      count(*) as members_count,
      round(avg(
        least(10, pr.shooting + pr.dribbling + pr.passing + pr.strength + pr.speed + pr.defense)
      )::numeric, 1) as average_player_quality
    from public.pelada_members pm
    join public.profiles pr on pr.id = pm.user_id
    where pm.pelada_id = p.id
  ) member_stats on true
  left join lateral (
    select
      count(*) as rounds_count,
      count(*) filter (
        where r.status = 'active'
          and (r.round_date + r.starts_at) > now()
      ) as scheduled_rounds_count,
      count(*) filter (
        where r.status = 'active'
          and ((r.round_date + r.starts_at) + make_interval(mins => r.duration_minutes)) < now()
      ) as finished_rounds_count
    from public.rounds r
    where r.pelada_id = p.id
  ) round_stats on true
  where p.is_public = true
    and p.status = 'active'
    and p.public_slug is not null
    and lower(p.public_slug) = lower(target_slug)
  limit 1;
$$;

revoke all on function public.get_public_pelada_by_slug(text) from public;
grant execute on function public.get_public_pelada_by_slug(text) to anon, authenticated;

drop function if exists public.get_explore_peladas();

create function public.get_explore_peladas()
returns table (
  id uuid,
  name text,
  description text,
  city text,
  neighborhood text,
  venue text,
  venue_address text,
  venue_lat double precision,
  venue_lng double precision,
  preferred_weekdays text,
  default_time time,
  monthly_fee numeric,
  daily_fee numeric,
  crest_url text,
  banner_url text,
  public_slug text,
  members_count bigint,
  scheduled_rounds_count bigint,
  finished_rounds_count bigint,
  average_player_quality numeric
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    p.name,
    p.description,
    p.city,
    p.neighborhood,
    p.venue,
    p.venue_address,
    p.venue_lat,
    p.venue_lng,
    p.preferred_weekdays,
    p.default_time,
    p.monthly_fee,
    p.daily_fee,
    p.crest_url,
    p.banner_url,
    p.public_slug,
    coalesce(member_stats.members_count, 0) as members_count,
    coalesce(round_stats.scheduled_rounds_count, 0) as scheduled_rounds_count,
    coalesce(round_stats.finished_rounds_count, 0) as finished_rounds_count,
    coalesce(member_stats.average_player_quality, 0) as average_player_quality
  from public.peladas p
  left join lateral (
    select
      count(*) as members_count,
      round(avg(
        least(10, pr.shooting + pr.dribbling + pr.passing + pr.strength + pr.speed + pr.defense)
      )::numeric, 1) as average_player_quality
    from public.pelada_members pm
    join public.profiles pr on pr.id = pm.user_id
    where pm.pelada_id = p.id
  ) member_stats on true
  left join lateral (
    select
      count(*) filter (
        where r.status = 'active'
          and (r.round_date + r.starts_at) > now()
      ) as scheduled_rounds_count,
      count(*) filter (
        where r.status = 'active'
          and ((r.round_date + r.starts_at) + make_interval(mins => r.duration_minutes)) < now()
      ) as finished_rounds_count
    from public.rounds r
    where r.pelada_id = p.id
  ) round_stats on true
  where p.is_public = true
    and p.status = 'active'
    and p.public_slug is not null
  order by p.created_at desc;
$$;

revoke all on function public.get_explore_peladas() from public;
grant execute on function public.get_explore_peladas() to authenticated;

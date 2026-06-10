alter table public.profiles
add column if not exists last_lat double precision,
add column if not exists last_lng double precision,
add column if not exists last_location_at timestamptz;

alter table public.profiles
drop constraint if exists profiles_last_lat_range_check,
drop constraint if exists profiles_last_lng_range_check;

alter table public.profiles
add constraint profiles_last_lat_range_check check (
  last_lat is null or (last_lat >= -90 and last_lat <= 90)
),
add constraint profiles_last_lng_range_check check (
  last_lng is null or (last_lng >= -180 and last_lng <= 180)
);

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
      count(*) filter (where r.status = 'scheduled') as scheduled_rounds_count,
      count(*) filter (where r.status = 'finished') as finished_rounds_count
    from public.rounds r
    where r.pelada_id = p.id
  ) round_stats on true
  where p.is_public = true
    and p.status = 'active'
    and p.public_slug is not null
  order by p.created_at desc;
$$;

drop function if exists public.get_explore_players();

create function public.get_explore_players()
returns table (
  id uuid,
  username text,
  name text,
  nickname text,
  avatar_url text,
  age integer,
  "position" public.player_position,
  height_cm integer,
  weight_kg integer,
  play_style text,
  player_description text,
  shooting integer,
  dribbling integer,
  passing integer,
  strength integer,
  speed integer,
  defense integer,
  last_lat double precision,
  last_lng double precision,
  last_location_at timestamptz,
  peladas_count bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    p.username,
    p.name,
    p.nickname,
    p.avatar_url,
    p.age,
    p.position as "position",
    p.height_cm,
    p.weight_kg,
    p.play_style,
    p.player_description,
    p.shooting,
    p.dribbling,
    p.passing,
    p.strength,
    p.speed,
    p.defense,
    p.last_lat,
    p.last_lng,
    p.last_location_at,
    coalesce(count(pm.pelada_id), 0) as peladas_count
  from public.profiles p
  left join public.pelada_members pm on pm.user_id = p.id
  where p.username is not null
  group by p.id
  order by p.created_at desc;
$$;

revoke all on function public.get_explore_peladas() from public;
revoke all on function public.get_explore_players() from public;
grant execute on function public.get_explore_peladas() to authenticated;
grant execute on function public.get_explore_players() to authenticated;

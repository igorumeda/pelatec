alter table public.peladas
add column if not exists venue_place_id text,
add column if not exists venue_address text,
add column if not exists venue_lat double precision,
add column if not exists venue_lng double precision;

alter table public.peladas
drop constraint if exists peladas_venue_lat_range_check,
drop constraint if exists peladas_venue_lng_range_check;

alter table public.peladas
add constraint peladas_venue_lat_range_check check (
  venue_lat is null or (venue_lat >= -90 and venue_lat <= 90)
),
add constraint peladas_venue_lng_range_check check (
  venue_lng is null or (venue_lng >= -180 and venue_lng <= 180)
);

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
      count(*) filter (where r.status = 'scheduled') as scheduled_rounds_count,
      count(*) filter (where r.status = 'finished') as finished_rounds_count
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

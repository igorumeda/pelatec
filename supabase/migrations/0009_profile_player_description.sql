alter table public.profiles
add column if not exists player_description text;

alter table public.profiles
drop constraint if exists profiles_player_description_length_check;

alter table public.profiles
add constraint profiles_player_description_length_check
check (player_description is null or char_length(player_description) <= 600);

drop function if exists public.get_public_profile_by_username(text);

create or replace function public.get_public_profile_by_username(target_username text)
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
  defense integer
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
    p.defense
  from public.profiles p
  where p.username is not null
    and lower(p.username) = lower(target_username)
  limit 1;
$$;

revoke all on function public.get_public_profile_by_username(text) from public;
grant execute on function public.get_public_profile_by_username(text) to anon, authenticated;

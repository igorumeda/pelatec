do $$
begin
  if not exists (select 1 from pg_type where typname = 'player_position') then
    create type public.player_position as enum ('striker', 'midfielder', 'fullback', 'center_back', 'goalkeeper');
  end if;
end $$;

alter table public.profiles
add column if not exists username text,
add column if not exists nickname text,
add column if not exists age integer,
add column if not exists position public.player_position,
add column if not exists height_cm integer,
add column if not exists weight_kg integer,
add column if not exists play_style text,
add column if not exists shooting integer not null default 0,
add column if not exists dribbling integer not null default 0,
add column if not exists passing integer not null default 0,
add column if not exists strength integer not null default 0,
add column if not exists speed integer not null default 0,
add column if not exists defense integer not null default 0;

alter table public.profiles
drop constraint if exists profiles_age_check,
drop constraint if exists profiles_height_cm_check,
drop constraint if exists profiles_weight_kg_check,
drop constraint if exists profiles_skill_range_check,
drop constraint if exists profiles_skill_points_total_check,
drop constraint if exists profiles_username_format_check;

alter table public.profiles
add constraint profiles_age_check check (age is null or age between 10 and 99),
add constraint profiles_height_cm_check check (height_cm is null or height_cm between 120 and 240),
add constraint profiles_weight_kg_check check (weight_kg is null or weight_kg between 35 and 200),
add constraint profiles_skill_range_check check (
  shooting between 0 and 10
  and dribbling between 0 and 10
  and passing between 0 and 10
  and strength between 0 and 10
  and speed between 0 and 10
  and defense between 0 and 10
),
add constraint profiles_skill_points_total_check check (
  shooting + dribbling + passing + strength + speed + defense <= 10
),
add constraint profiles_username_format_check check (
  username is null or username ~ '^[a-z0-9_]{3,20}$'
);

create unique index if not exists profiles_username_lower_idx
on public.profiles (lower(username))
where username is not null;

insert into storage.buckets (id, name, public)
values ('profile-avatars', 'profile-avatars', true)
on conflict (id) do nothing;

drop policy if exists "users upload own avatars" on storage.objects;
create policy "users upload own avatars"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users update own avatars" on storage.objects;
create policy "users update own avatars"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users delete own avatars" on storage.objects;
create policy "users delete own avatars"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

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

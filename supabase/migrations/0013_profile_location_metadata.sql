alter table public.profiles
add column if not exists last_location_label text,
add column if not exists last_location_source text;

alter table public.profiles
drop constraint if exists profiles_last_location_source_check,
drop constraint if exists profiles_last_location_label_length_check;

alter table public.profiles
add constraint profiles_last_location_source_check check (
  last_location_source is null or last_location_source in ('browser', 'manual')
),
add constraint profiles_last_location_label_length_check check (
  last_location_label is null or char_length(last_location_label) <= 240
);

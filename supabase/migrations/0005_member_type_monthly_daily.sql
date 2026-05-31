create type public.member_type as enum ('monthly', 'daily');

alter table public.pelada_members
add column member_type public.member_type not null default 'monthly';

update public.pelada_members
set member_type = 'monthly'
where member_type is null;

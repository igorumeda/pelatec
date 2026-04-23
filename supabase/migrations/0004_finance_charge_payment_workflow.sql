do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('pending', 'approved', 'rejected');
  end if;
end $$;

alter table public.player_charges
add column if not exists pix_code text;

alter table public.player_payments
add column if not exists proof_url text,
add column if not exists status public.payment_status not null default 'pending',
add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
add column if not exists reviewed_at timestamptz,
add column if not exists rejection_reason text;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

drop policy if exists "members upload own payment proofs" on storage.objects;
create policy "members upload own payment proofs"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "members view own payment proofs or admins" on storage.objects;
create policy "members view own payment proofs or admins"
on storage.objects for select
to authenticated
using (
  bucket_id = 'payment-proofs'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1
      from public.player_payments pp
      where pp.proof_url like '%' || storage.objects.name
        and public.has_pelada_role(pp.pelada_id, array['owner','admin']::public.member_role[])
    )
  )
);

drop policy if exists "players insert own payments" on public.player_payments;
create policy "players insert own payments"
on public.player_payments for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_pelada_member(pelada_id)
);

drop policy if exists "players update rejected own payments" on public.player_payments;
create policy "players update rejected own payments"
on public.player_payments for update
to authenticated
using (user_id = auth.uid() and status = 'rejected')
with check (user_id = auth.uid() and status = 'pending');

create index if not exists player_charges_competence_idx on public.player_charges(pelada_id, competence);
create index if not exists player_payments_status_idx on public.player_payments(pelada_id, status);

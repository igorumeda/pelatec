drop policy if exists "users cancel own pending join requests" on public.pelada_join_requests;

create policy "users cancel own pending join requests"
on public.pelada_join_requests for delete
to authenticated
using (
  user_id = auth.uid()
  and status = 'pending'
);

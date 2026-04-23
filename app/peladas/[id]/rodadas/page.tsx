import Link from "next/link";
import { upsertRoundAction } from "@/app/actions";
import { ActionStateForm } from "@/components/action-state-form";
import { Card, EmptyState, Field, PageHeader } from "@/components/ui";
import { canManage, getMyRole, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dateLabel } from "@/lib/utils";

export default async function RoundsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const role = await getMyRole(id);
  const supabase = await createClient();
  const { data: pelada } = await supabase.from("peladas").select("name, venue, default_time").eq("id", id).single();
  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .eq("pelada_id", id)
    .order("round_date", { ascending: false });
  const action = upsertRoundAction.bind(null, null);

  return (
    <>
      <PageHeader title="Agenda" description={`Rodadas da ${pelada?.name ?? "pelada"}.`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card>
          {!rounds?.length ? <EmptyState title="Nenhuma rodada criada" /> : null}
          <div className="space-y-3">
            {rounds?.map((round: any) => (
              <Link key={round.id} href={`/rodadas/${round.id}`} className="block rounded-md border border-zinc-200 p-4 hover:bg-zinc-50">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{round.title ?? "Rodada"}</p>
                  <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs uppercase">{round.status}</span>
                </div>
                <p className="mt-1 text-sm text-zinc-600">{dateLabel(round.round_date)} às {round.starts_at.slice(0, 5)}</p>
              </Link>
            ))}
          </div>
        </Card>
        {canManage(role) ? (
          <Card>
            <h2 className="font-semibold">Criar rodada</h2>
            <ActionStateForm action={action} submitLabel="Criar" className="mt-4 space-y-4">
              <input type="hidden" name="pelada_id" value={id} />
              <Field label="Título"><input name="title" placeholder="Rodada de quinta" /></Field>
              <Field label="Data"><input name="round_date" type="date" required /></Field>
              <Field label="Início"><input name="starts_at" type="time" required defaultValue={pelada?.default_time?.slice(0, 5) ?? ""} /></Field>
              <Field label="Local"><input name="venue" defaultValue={pelada?.venue ?? ""} /></Field>
              <Field label="Limite de jogadores"><input name="player_limit" type="number" min="1" /></Field>
              <Field label="Observações"><textarea name="notes" rows={3} /></Field>
              <input type="hidden" name="status" value="agendado" />
            </ActionStateForm>
          </Card>
        ) : null}
      </div>
    </>
  );
}

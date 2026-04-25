import Link from "next/link";
import { Calendar, CalendarDays, CircleDollarSign, Rocket, Settings, UsersRound } from "lucide-react";
import { Card, CardTitle, LinkButton, PageHeader, Stat } from "@/components/ui";
import { canManage, getMyRole, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { brl, dateLabel } from "@/lib/utils";

export default async function PeladaDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const role = await getMyRole(id);
  const supabase = await createClient();
  const { data: pelada } = await supabase.from("peladas").select("*").eq("id", id).single();
  const { count: memberCount } = await supabase.from("pelada_members").select("*", { count: "exact", head: true }).eq("pelada_id", id);
  const { data: rounds } = await supabase
    .from("rounds")
    .select("id, title, round_date, starts_at")
    .eq("pelada_id", id)
    .gte("round_date", new Date().toISOString().slice(0, 10))
    .order("round_date")
    .limit(3);
  const { data: entries } = await supabase.from("financial_entries").select("type, amount").eq("pelada_id", id);
  const { count: debtors } = await supabase.from("player_charges").select("*", { count: "exact", head: true }).eq("pelada_id", id).eq("status", "open");
  const balance = (entries ?? []).reduce((sum: number, item: any) => sum + (item.type === "revenue" ? Number(item.amount) : -Number(item.amount)), 0);

  return (
    <>
      <PageHeader title={pelada?.name ?? "Pelada"} description={pelada?.description ?? "Painel operacional da pelada."} />
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Membros" value={memberCount ?? 0} />
        <Stat label="Proximas rodadas" value={rounds?.length ?? 0} />
        <Stat label="Pendencias" value={debtors ?? 0} />
        <Stat label="Saldo" value={brl(balance)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardTitle icon={CalendarDays}>Proximas rodadas</CardTitle>
          <div className="mt-4 space-y-3">
            {rounds?.map((round: any) => (
              <Link key={round.id} href={`/rodadas/${round.id}`} className="block rounded-md border border-zinc-200 p-4 hover:bg-zinc-50">
                <p className="font-medium">{round.title ?? "Rodada"}</p>
                <p className="text-sm text-zinc-600">{dateLabel(round.round_date)} as {round.starts_at.slice(0, 5)}</p>
              </Link>
            ))}
            {!rounds?.length ? <p className="text-sm text-zinc-600">Nenhuma rodada agendada.</p> : null}
          </div>
        </Card>

        <Card>
          <CardTitle icon={Rocket}>Atalhos</CardTitle>
          <div className="mt-4 grid gap-3">
            <LinkButton href={`/peladas/${id}/rodadas`} variant="secondary"><Calendar size={16} /> Agenda</LinkButton>
            <LinkButton href={`/peladas/${id}/membros`} variant="secondary"><UsersRound size={16} /> Membros</LinkButton>
            {canManage(role) ? <LinkButton href={`/peladas/${id}/financeiro`} variant="secondary"><CircleDollarSign size={16} /> Financeiro</LinkButton> : null}
            {canManage(role) ? <LinkButton href={`/peladas/${id}/editar`} variant="secondary"><Settings size={16} /> Editar dados</LinkButton> : null}
          </div>
        </Card>
      </div>
    </>
  );
}

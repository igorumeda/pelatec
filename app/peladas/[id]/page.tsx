import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  CalendarDays,
  CalendarPlus2,
  CircleDollarSign,
  Clock3,
  MapPin,
  ReceiptText,
  Rocket,
  Settings,
  UserPlus,
  UsersRound,
  Wallet
} from "lucide-react";
import { redirect } from "next/navigation";
import { BackLink, Card, CardTitle, EmptyState, LinkButton, PageHeader, Stat } from "@/components/ui";
import { canManage, getMyRole, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { brl, competenceLabel, dateLabel, peladaStatusLabel, roundStatusLabel } from "@/lib/utils";

type PresenceStatus = "confirmed" | "declined" | "pending";

type RoundSummary = {
  id: string;
  title: string | null;
  round_date: string;
  starts_at: string;
  venue: string | null;
  player_limit: number | null;
  notes: string | null;
  status: string;
};

export default async function PeladaDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const role = await getMyRole(id);
  if (!role) redirect("/dashboard");

  const manageable = canManage(role);
  const supabase = await createClient();
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().slice(0, 10);

  const [
    peladaResult,
    membersResult,
    futureRoundsResult,
    latestRoundResult,
    monthlyFinishedRoundsResult,
    entriesResult,
    paymentsResult,
    openChargesCountResult,
    openChargesResult
  ] = await Promise.all([
    supabase.from("peladas").select("*").eq("id", id).single(),
    supabase.from("pelada_members").select("user_id, profiles(name)").eq("pelada_id", id).order("created_at"),
    supabase
      .from("rounds")
      .select("id, title, round_date, starts_at, venue, player_limit, notes, status")
      .eq("pelada_id", id)
      .gte("round_date", todayKey)
      .order("round_date")
      .order("starts_at")
      .limit(6),
    supabase
      .from("rounds")
      .select("id, title, round_date, starts_at, venue, player_limit, notes, status")
      .eq("pelada_id", id)
      .eq("status", "finished")
      .order("round_date", { ascending: false })
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("rounds")
      .select("*", { count: "exact", head: true })
      .eq("pelada_id", id)
      .eq("status", "finished")
      .gte("round_date", monthStart)
      .lt("round_date", nextMonthStart),
    supabase.from("financial_entries").select("type, amount, entry_date").eq("pelada_id", id),
    supabase.from("player_payments").select("status, amount, paid_at").eq("pelada_id", id),
    supabase.from("player_charges").select("*", { count: "exact", head: true }).eq("pelada_id", id).eq("status", "open"),
    supabase
      .from("player_charges")
      .select("id, user_id, description, competence, due_date, amount")
      .eq("pelada_id", id)
      .eq("status", "open")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(5)
  ]);

  const pelada = peladaResult.data;
  const members = normalizeMembers(membersResult.data ?? []);
  const futureRounds = (futureRoundsResult.data ?? []) as RoundSummary[];
  const latestFinishedRound = latestRoundResult.data as RoundSummary | null;
  const entries = entriesResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const pendingCharges = openChargesResult.data ?? [];
  const pendingChargeCount = openChargesCountResult.count ?? 0;

  const trackedRoundIds = [...new Set([...futureRounds.map((round) => round.id), latestFinishedRound?.id].filter(Boolean))] as string[];
  const { data: presenceRows } = trackedRoundIds.length
    ? await supabase.from("round_presence").select("round_id, status").in("round_id", trackedRoundIds)
    : { data: [] as { round_id: string; status: PresenceStatus }[] };

  const presenceByRound = buildPresenceByRound(presenceRows ?? []);
  const nextRound = futureRounds[0] ?? null;
  const otherFutureRounds = futureRounds.slice(1);
  const nextRoundPresence = nextRound ? presenceByRound.get(nextRound.id) ?? emptyPresenceCount() : emptyPresenceCount();
  const latestRoundPresence = latestFinishedRound ? presenceByRound.get(latestFinishedRound.id) ?? emptyPresenceCount() : emptyPresenceCount();

  const approvedPayments = payments.filter((payment: any) => payment.status === "approved");
  const totalApprovedPayments = approvedPayments.reduce((sum: number, payment: any) => sum + Number(payment.amount), 0);
  const entryBalance = entries.reduce((sum: number, entry: any) => sum + (entry.type === "revenue" ? Number(entry.amount) : -Number(entry.amount)), 0);
  const currentBalance = entryBalance + totalApprovedPayments;

  const monthlyRevenueFromEntries = entries
    .filter((entry: any) => entry.type === "revenue" && entry.entry_date >= monthStart && entry.entry_date < nextMonthStart)
    .reduce((sum: number, entry: any) => sum + Number(entry.amount), 0);
  const monthlyExpenses = entries
    .filter((entry: any) => entry.type === "expense" && entry.entry_date >= monthStart && entry.entry_date < nextMonthStart)
    .reduce((sum: number, entry: any) => sum + Number(entry.amount), 0);
  const monthlyApprovedPayments = approvedPayments
    .filter((payment: any) => payment.paid_at >= monthStart && payment.paid_at < nextMonthStart)
    .reduce((sum: number, payment: any) => sum + Number(payment.amount), 0);
  const monthlyRevenue = monthlyRevenueFromEntries + monthlyApprovedPayments;
  const monthlyBalance = monthlyRevenue - monthlyExpenses;

  const alerts = buildAlerts({
    manageable,
    currentBalance,
    pendingChargeCount,
    nextRound,
    nextRoundPresence
  });

  const nextRoundLimitLabel = nextRound?.player_limit ? `${nextRoundPresence.confirmed}/${nextRound.player_limit} jogadores` : `${nextRoundPresence.confirmed} confirmados`;
  const topMeta = [
    pelada?.venue ? { icon: MapPin, label: pelada.venue } : null,
    pelada?.default_time ? { icon: Clock3, label: `Horario padrao ${pelada.default_time.slice(0, 5)}` } : null,
    pelada?.status ? { icon: CircleDollarSign, label: `Status ${peladaStatusLabel(pelada.status)}` } : null
  ].filter(Boolean) as { icon: typeof MapPin; label: string }[];

  return (
    <>
      <PageHeader
        title={pelada?.name ?? "Pelada"}
        description={pelada?.description ?? "Painel operacional da pelada."}
        action={<BackLink href="/dashboard">Voltar ao painel</BackLink>}
      />

      {topMeta.length ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {topMeta.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
              <item.icon size={16} className="text-field-700" />
              {item.label}
            </span>
          ))}
        </div>
      ) : null}

      <div className={`grid gap-4 ${manageable ? "sm:grid-cols-2 xl:grid-cols-5" : "sm:grid-cols-2 xl:grid-cols-4"}`}>
        <Stat label="Membros" value={members.length} description="Total de participantes vinculados" />
        <Stat label="Proximas rodadas" value={futureRounds.length} description={futureRounds.length ? "Rodadas futuras agendadas" : "Nenhuma rodada futura"} />
        <Stat
          label="Confirmados da proxima"
          value={nextRoundPresence.confirmed}
          description={nextRound ? nextRoundLimitLabel : "Aguardando nova rodada"}
        />
        {manageable ? (
          <>
            <Stat label="Pendencias abertas" value={pendingChargeCount} description="Cobrancas ainda em aberto" />
            <Stat label="Saldo atual" value={brl(currentBalance)} description="Lancamentos mais pagamentos aprovados" />
          </>
        ) : (
          <Stat label="Rodadas no mes" value={monthlyFinishedRoundsResult.count ?? 0} description="Rodadas encerradas neste mes" />
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardTitle icon={CalendarDays}>Proxima rodada</CardTitle>
            {nextRound ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-zinc-900">{nextRound.title ?? "Rodada"}</p>
                      <p className="mt-1 text-sm text-zinc-600">
                        {dateLabel(nextRound.round_date)} as {nextRound.starts_at.slice(0, 5)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-600">
                        <span className="rounded-md bg-white px-2 py-1">{roundStatusLabel(nextRound.status)}</span>
                        <span className="rounded-md bg-white px-2 py-1">{nextRound.venue ?? pelada?.venue ?? "Local nao informado"}</span>
                        <span className="rounded-md bg-white px-2 py-1">{nextRoundPresence.confirmed} confirmados</span>
                        <span className="rounded-md bg-white px-2 py-1">{nextRoundPresence.pending} pendentes</span>
                        {nextRound.player_limit ? <span className="rounded-md bg-white px-2 py-1">Limite {nextRound.player_limit}</span> : null}
                      </div>
                    </div>
                    <LinkButton href={`/rodadas/${nextRound.id}`} variant="secondary">Ver detalhes</LinkButton>
                  </div>
                </div>

                {otherFutureRounds.length ? (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-zinc-700">Outras proximas rodadas</p>
                    {otherFutureRounds.map((round) => {
                      const counts = presenceByRound.get(round.id) ?? emptyPresenceCount();
                      return (
                        <Link key={round.id} href={`/rodadas/${round.id}`} className="block rounded-md border border-zinc-200 p-4 hover:bg-zinc-50">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium">{round.title ?? "Rodada"}</p>
                            <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs uppercase text-zinc-600">{roundStatusLabel(round.status)}</span>
                          </div>
                          <p className="mt-1 text-sm text-zinc-600">
                            {dateLabel(round.round_date)} as {round.starts_at.slice(0, 5)} - {counts.confirmed} confirmados
                          </p>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyState
                title="Nenhuma rodada agendada"
                description={manageable ? "Agende uma nova rodada para comecar a organizar a proxima pelada." : "Ainda nao existe nenhuma rodada futura para esta pelada."}
              />
            )}
            {!nextRound && manageable ? (
              <div className="mt-4">
                <LinkButton href={`/peladas/${id}/rodadas`}><CalendarPlus2 size={16} /> Agendar rodada</LinkButton>
              </div>
            ) : null}
          </Card>

          <Card>
            <CardTitle icon={Calendar}>Ultima rodada realizada</CardTitle>
            {latestFinishedRound ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-md border border-zinc-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold">{latestFinishedRound.title ?? "Rodada"}</p>
                      <p className="mt-1 text-sm text-zinc-600">{dateLabel(latestFinishedRound.round_date)} as {latestFinishedRound.starts_at.slice(0, 5)}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-600">
                        <span className="rounded-md bg-zinc-100 px-2 py-1">{latestFinishedRound.venue ?? pelada?.venue ?? "Local nao informado"}</span>
                        <span className="rounded-md bg-zinc-100 px-2 py-1">{latestRoundPresence.confirmed} presentes</span>
                      </div>
                      {latestFinishedRound.notes ? <p className="mt-3 text-sm text-zinc-600">{latestFinishedRound.notes}</p> : null}
                    </div>
                    <LinkButton href={`/rodadas/${latestFinishedRound.id}`} variant="secondary">Ver detalhes</LinkButton>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState title="Nenhuma rodada encerrada" description="Assim que a primeira rodada for encerrada, o resumo vai aparecer aqui." />
            )}
          </Card>

          {manageable ? (
            <Card>
              <div className="flex items-center justify-between gap-3">
                <CardTitle icon={ReceiptText}>Pendencias recentes</CardTitle>
                <Link href={`/peladas/${id}/financeiro`} className="text-sm font-semibold text-field-700 hover:underline">Ver todas</Link>
              </div>
              <div className="mt-4 space-y-3">
                {pendingCharges.map((charge: any) => (
                  <div key={charge.id} className="rounded-md border border-zinc-200 p-4">
                    <p className="font-medium">{memberNameById(members, charge.user_id)}</p>
                    <p className="mt-1 text-sm text-zinc-600">{charge.description} - {brl(charge.amount)}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {charge.due_date ? `Vencimento ${dateLabel(charge.due_date)}` : `Competencia ${competenceLabel(charge.competence)}`}
                    </p>
                  </div>
                ))}
                {!pendingCharges.length ? <p className="text-sm text-zinc-600">Nao ha pendencias financeiras em aberto.</p> : null}
              </div>
            </Card>
          ) : null}
        </div>

        <aside className="space-y-6">
          <Card>
            <CardTitle icon={Rocket}>Acoes rapidas</CardTitle>
            <div className="mt-4 grid gap-3">
              {manageable ? <LinkButton href={`/peladas/${id}/rodadas`}><CalendarPlus2 size={16} /> Agendar rodada</LinkButton> : null}
              {manageable ? <LinkButton href={`/peladas/${id}/membros`} variant="secondary"><UserPlus size={16} /> Adicionar membro</LinkButton> : null}
              {manageable ? <LinkButton href={`/peladas/${id}/financeiro`} variant="secondary"><CircleDollarSign size={16} /> Lancar pagamento</LinkButton> : null}
              {manageable ? <LinkButton href={`/peladas/${id}/financeiro`} variant="secondary"><Wallet size={16} /> Registrar despesa</LinkButton> : null}
              <LinkButton href={`/peladas/${id}/rodadas`} variant="secondary"><CalendarDays size={16} /> Ver agenda</LinkButton>
              <LinkButton href={`/peladas/${id}/membros`} variant="secondary"><UsersRound size={16} /> Ver membros</LinkButton>
              {manageable ? <LinkButton href={`/peladas/${id}/financeiro`} variant="secondary"><ReceiptText size={16} /> Ver financeiro</LinkButton> : null}
              {manageable ? <LinkButton href={`/peladas/${id}/editar`} variant="secondary"><Settings size={16} /> Editar dados</LinkButton> : null}
            </div>
          </Card>

          {manageable ? (
            <Card>
              <CardTitle icon={CircleDollarSign}>Resumo financeiro do mes</CardTitle>
              <div className="mt-4 space-y-3">
                {monthlyRevenue || monthlyExpenses || pendingChargeCount ? (
                  <>
                    <Row label="Receitas do mes" value={brl(monthlyRevenue)} />
                    <Row label="Despesas do mes" value={brl(monthlyExpenses)} />
                    <Row label="Saldo do mes" value={brl(monthlyBalance)} highlight />
                    <Row label="Pendencias abertas" value={pendingChargeCount} />
                  </>
                ) : (
                  <p className="text-sm text-zinc-600">Nenhuma movimentacao financeira neste mes.</p>
                )}
              </div>
            </Card>
          ) : null}

          <Card>
            <CardTitle icon={AlertTriangle}>Alertas operacionais</CardTitle>
            <div className="mt-4 space-y-3">
              {alerts.map((alert) => (
                <div key={alert} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                  {alert}
                </div>
              ))}
              {!alerts.length ? <p className="text-sm text-zinc-600">Nenhum alerta no momento.</p> : null}
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}

function Row({ label, value, highlight = false }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-3 text-sm">
      <span className="text-zinc-600">{label}</span>
      <strong className={highlight ? "text-field-700" : "text-zinc-900"}>{value}</strong>
    </div>
  );
}

function normalizeMembers(rows: any[]) {
  return rows.map((member) => ({
    user_id: member.user_id,
    name: Array.isArray(member.profiles) ? member.profiles[0]?.name ?? "Jogador" : member.profiles?.name ?? "Jogador"
  }));
}

function memberNameById(members: { user_id: string; name: string }[], userId: string) {
  return members.find((member) => member.user_id === userId)?.name ?? "Jogador";
}

function emptyPresenceCount() {
  return { confirmed: 0, declined: 0, pending: 0 };
}

function buildPresenceByRound(rows: { round_id: string; status: PresenceStatus }[]) {
  const result = new Map<string, { confirmed: number; declined: number; pending: number }>();

  for (const row of rows) {
    const current = result.get(row.round_id) ?? emptyPresenceCount();
    current[row.status] += 1;
    result.set(row.round_id, current);
  }

  return result;
}

function buildAlerts({
  manageable,
  currentBalance,
  pendingChargeCount,
  nextRound,
  nextRoundPresence
}: {
  manageable: boolean;
  currentBalance: number;
  pendingChargeCount: number;
  nextRound: RoundSummary | null;
  nextRoundPresence: { confirmed: number; declined: number; pending: number };
}) {
  const alerts: string[] = [];

  if (!nextRound) alerts.push("Nenhuma rodada agendada no momento.");
  if (manageable && currentBalance < 0) alerts.push("O saldo atual da pelada esta negativo.");
  if (manageable && pendingChargeCount > 0) alerts.push(`Existem ${pendingChargeCount} pendencia(s) financeira(s) em aberto.`);

  if (nextRound) {
    const minimumConfirmed = nextRound.player_limit ? Math.max(1, Math.ceil(nextRound.player_limit / 2)) : 6;
    if (nextRoundPresence.confirmed < minimumConfirmed) {
      alerts.push("A proxima rodada ainda tem poucos confirmados.");
    }
    if (nextRoundPresence.pending > 0) {
      alerts.push(`Ainda ha ${nextRoundPresence.pending} membro(s) sem responder a proxima rodada.`);
    }
  }

  return alerts;
}

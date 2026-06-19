import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  CalendarDays,
  CalendarPlus2,
  Check,
  CircleDollarSign,
  Clock3,
  MapPin,
  ReceiptText,
  UserPlus,
  UsersRound,
  X
} from "lucide-react";
import { reviewPeladaJoinRequestFormAction } from "@/app/actions";
import { redirect } from "next/navigation";
import { PeladaQuickActionsMenu } from "@/components/pelada-quick-actions-menu";
import { Card, CardTitle, EmptyState, LinkButton, PageHeader, Stat } from "@/components/ui";
import { canManage, getMyRole, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { brl, competenceLabel, dateLabel, getRoundOperationalStatus, peladaStatusLabel, roundStatusLabel } from "@/lib/utils";

type PresenceStatus = "confirmed" | "declined" | "pending";

type RoundSummary = {
  id: string;
  title: string | null;
  round_date: string;
  starts_at: string;
  duration_minutes: number | string | null;
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
    openChargesResult,
    joinRequestsResult
  ] = await Promise.all([
    supabase.from("peladas").select("*").eq("id", id).single(),
    supabase.from("pelada_members").select("user_id, profiles(name)").eq("pelada_id", id).order("created_at"),
    supabase
      .from("rounds")
      .select("id, title, round_date, starts_at, duration_minutes, venue, player_limit, notes, status")
      .eq("pelada_id", id)
      .eq("status", "active")
      .gte("round_date", todayKey)
      .order("round_date")
      .order("starts_at")
      .limit(20),
    supabase
      .from("rounds")
      .select("id, title, round_date, starts_at, duration_minutes, venue, player_limit, notes, status")
      .eq("pelada_id", id)
      .eq("status", "active")
      .lte("round_date", todayKey)
      .order("round_date", { ascending: false })
      .order("starts_at", { ascending: false })
      .limit(20),
    supabase
      .from("rounds")
      .select("id, round_date, starts_at, duration_minutes, status")
      .eq("pelada_id", id)
      .eq("status", "active")
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
      .limit(5),
    manageable
      ? supabase
        .from("pelada_join_requests")
        .select("id, user_id, message, created_at, profiles(name, email, avatar_url)")
        .eq("pelada_id", id)
        .eq("status", "pending")
        .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] })
  ]);

  const pelada = peladaResult.data;
  const members = normalizeMembers(membersResult.data ?? []);
  const futureRounds = ((futureRoundsResult.data ?? []) as RoundSummary[])
    .filter((round) => getRoundOperationalStatus(round) !== "finished")
    .slice(0, 6);
  const latestFinishedRound = ((latestRoundResult.data ?? []) as RoundSummary[])
    .find((round) => getRoundOperationalStatus(round) === "finished") ?? null;
  const finishedRoundsThisMonth = (monthlyFinishedRoundsResult.data ?? [])
    .filter((round: any) => getRoundOperationalStatus(round) === "finished").length;
  const entries = entriesResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const pendingCharges = openChargesResult.data ?? [];
  const joinRequests = joinRequestsResult.data ?? [];
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

  const nextRoundLimitLabel = nextRound?.player_limit
    ? `${nextRoundPresence.confirmed}/${nextRound.player_limit} jogadores`
    : `${nextRoundPresence.confirmed} confirmados`;
  const peladaVenueLabel = pelada?.venue_address ?? pelada?.venue ?? null;
  const topMeta = [
    peladaVenueLabel ? { icon: MapPin, label: peladaVenueLabel } : null,
    pelada?.default_time ? { icon: Clock3, label: `Horário padrão ${pelada.default_time.slice(0, 5)}` } : null,
    pelada?.status ? { icon: CircleDollarSign, label: `Status ${peladaStatusLabel(pelada.status)}` } : null
  ].filter(Boolean) as { icon: typeof MapPin; label: string }[];
  const publicPeladaHref = pelada?.is_public && pelada?.public_slug ? `/pelada/${pelada.public_slug}` : null;

  return (
    <>
      <section className="surface-dark px-6 py-7 sm:px-8">
        <PageHeader
          title={pelada?.name ?? "Pelada"}
          description={pelada?.description ?? "Painel operacional da pelada."}
          theme="dark"
          action={<PeladaQuickActionsMenu peladaId={id} manageable={manageable} publicHref={publicPeladaHref} />}
        />

        {topMeta.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {topMeta.map((item) => (
              <span key={item.label} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/12 px-3 py-2 text-sm text-white">
                <item.icon size={16} className="text-field-200" />
                {item.label}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <nav className="mt-4 flex gap-2 overflow-x-auto rounded-3xl border border-brand-700/45 bg-brand-950/55 p-2 shadow-soft" aria-label="Menu da pelada">
        <PeladaNavLink href={`/peladas/${id}/rodadas`} icon={CalendarDays} label="Rodadas" />
        <PeladaNavLink href={`/peladas/${id}/membros`} icon={UsersRound} label="Membros" />
        {manageable ? <PeladaNavLink href={`/peladas/${id}/financeiro`} icon={CircleDollarSign} label="Financeiro" /> : null}
      </nav>

      <div className={`mt-6 grid gap-4 ${manageable ? "sm:grid-cols-2 xl:grid-cols-5" : "sm:grid-cols-2 xl:grid-cols-4"}`}>
        <Stat label="Membros" value={members.length} description="Total de participantes vinculados" />
        <Stat label="Próximas rodadas" value={futureRounds.length} description={futureRounds.length ? "Rodadas futuras agendadas" : "Nenhuma rodada futura"} />
        <Stat label="Confirmados da próxima" value={nextRoundPresence.confirmed} description={nextRound ? nextRoundLimitLabel : "Aguardando nova rodada"} />
        {manageable ? (
          <>
            <Stat label="Pendências abertas" value={pendingChargeCount} description="Cobranças ainda em aberto" />
            <Stat label="Saldo atual" value={brl(currentBalance)} description="Lançamentos mais pagamentos aprovados" />
          </>
        ) : (
          <Stat label="Rodadas no mês" value={finishedRoundsThisMonth} description="Rodadas encerradas neste mês" />
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardTitle icon={CalendarDays}>Próxima rodada</CardTitle>
            {nextRound ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{nextRound.title ?? "Rodada"}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {dateLabel(nextRound.round_date)} às {nextRound.starts_at.slice(0, 5)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        <Chip>{roundStatusLabel(getRoundOperationalStatus(nextRound))}</Chip>
                        <Chip>{nextRound.venue ?? peladaVenueLabel ?? "Local não informado"}</Chip>
                        <Chip>{nextRoundPresence.confirmed} confirmados</Chip>
                        <Chip>{nextRoundPresence.pending} pendentes</Chip>
                        {nextRound.player_limit ? <Chip>Limite {nextRound.player_limit}</Chip> : null}
                      </div>
                    </div>
                    <LinkButton href={`/rodadas/${nextRound.id}`} variant="secondary">
                      Ver detalhes
                    </LinkButton>
                  </div>
                </div>

                {otherFutureRounds.length ? (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-700">Outras próximas rodadas</p>
                    {otherFutureRounds.map((round) => {
                      const counts = presenceByRound.get(round.id) ?? emptyPresenceCount();
                      return (
                        <Link key={round.id} href={`/rodadas/${round.id}`} className="block rounded-2xl border border-slate-200 p-4 hover:bg-slate-50">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-slate-900">{round.title ?? "Rodada"}</p>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase text-slate-600">
                              {roundStatusLabel(getRoundOperationalStatus(round))}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">
                            {dateLabel(round.round_date)} às {round.starts_at.slice(0, 5)} • {counts.confirmed} confirmados
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
                description={
                  manageable
                    ? "Agende uma nova rodada para começar a organizar a próxima pelada."
                    : "Ainda não existe nenhuma rodada futura para esta pelada."
                }
              />
            )}
            {!nextRound && manageable ? (
              <div className="mt-4">
                <LinkButton href={`/peladas/${id}/rodadas`}>
                  <CalendarPlus2 size={16} />
                  Agendar rodada
                </LinkButton>
              </div>
            ) : null}
          </Card>

          <Card>
            <CardTitle icon={Calendar}>Última rodada realizada</CardTitle>
            {latestFinishedRound ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{latestFinishedRound.title ?? "Rodada"}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {dateLabel(latestFinishedRound.round_date)} às {latestFinishedRound.starts_at.slice(0, 5)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        <Chip>{latestFinishedRound.venue ?? peladaVenueLabel ?? "Local não informado"}</Chip>
                        <Chip>{latestRoundPresence.confirmed} presentes</Chip>
                      </div>
                      {latestFinishedRound.notes ? <p className="mt-3 text-sm text-slate-600">{latestFinishedRound.notes}</p> : null}
                    </div>
                    <LinkButton href={`/rodadas/${latestFinishedRound.id}`} variant="secondary">
                      Ver detalhes
                    </LinkButton>
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
                <CardTitle icon={ReceiptText}>Pendências recentes</CardTitle>
                <Link href={`/peladas/${id}/financeiro`} className="text-sm font-semibold text-field-700 hover:underline">
                  Ver todas
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {pendingCharges.map((charge: any) => (
                  <div key={charge.id} className="rounded-2xl border border-slate-200 p-4">
                    <p className="font-medium text-slate-900">{memberNameById(members, charge.user_id)}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {charge.description} • {brl(charge.amount)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {charge.due_date ? `Vencimento ${dateLabel(charge.due_date)}` : `Competência ${competenceLabel(charge.competence)}`}
                    </p>
                  </div>
                ))}
                {!pendingCharges.length ? <p className="text-sm text-slate-600">Não há pendências financeiras em aberto.</p> : null}
              </div>
            </Card>
          ) : null}
        </div>

        <aside className="space-y-6">
          {manageable ? (
            <Card>
              <CardTitle icon={UserPlus}>Solicitações de entrada</CardTitle>
              <div className="mt-4 space-y-3">
                {joinRequests.map((request: any) => {
                  const profile = Array.isArray(request.profiles) ? request.profiles[0] : request.profiles;
                  return (
                    <div key={request.id} className="rounded-2xl border border-slate-200 p-3 text-sm">
                      <div>
                        <p className="font-semibold text-slate-900">{profile?.name ?? "Jogador"}</p>
                        <p className="text-slate-600">{profile?.email ?? "E-mail não informado"}</p>
                        {request.message ? <p className="mt-2 rounded-xl bg-slate-50 p-3 text-slate-700">{request.message}</p> : null}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <ReviewJoinRequestForm requestId={request.id} peladaId={id} status="approved" memberType="daily">
                          <Check size={15} />
                          Aceitar diarista
                        </ReviewJoinRequestForm>
                        <ReviewJoinRequestForm requestId={request.id} peladaId={id} status="approved" memberType="monthly">
                          <Check size={15} />
                          Aceitar mensalista
                        </ReviewJoinRequestForm>
                        <ReviewJoinRequestForm requestId={request.id} peladaId={id} status="rejected" memberType="daily" variant="danger">
                          <X size={15} />
                          Recusar
                        </ReviewJoinRequestForm>
                      </div>
                    </div>
                  );
                })}
                {!joinRequests.length ? <p className="text-sm text-slate-600">Nenhuma solicitação pendente.</p> : null}
              </div>
            </Card>
          ) : null}

          {manageable ? (
            <Card>
              <CardTitle icon={CircleDollarSign}>Resumo financeiro do mês</CardTitle>
              <div className="mt-4 space-y-3">
                {monthlyRevenue || monthlyExpenses || pendingChargeCount ? (
                  <>
                    <Row label="Receitas do mês" value={brl(monthlyRevenue)} />
                    <Row label="Despesas do mês" value={brl(monthlyExpenses)} />
                    <Row label="Saldo do mês" value={brl(monthlyBalance)} highlight />
                    <Row label="Pendências abertas" value={pendingChargeCount} />
                  </>
                ) : (
                  <p className="text-sm text-slate-600">Nenhuma movimentação financeira neste mês.</p>
                )}
              </div>
            </Card>
          ) : null}

          <Card>
            <CardTitle icon={AlertTriangle}>Alertas operacionais</CardTitle>
            <div className="mt-4 space-y-3">
              {alerts.map((alert) => (
                <div key={alert} className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                  {alert}
                </div>
              ))}
              {!alerts.length ? <p className="text-sm text-slate-600">Nenhum alerta no momento.</p> : null}
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}

function ReviewJoinRequestForm({
  requestId,
  peladaId,
  status,
  memberType,
  variant = "default",
  children
}: {
  requestId: string;
  peladaId: string;
  status: "approved" | "rejected";
  memberType: "monthly" | "daily";
  variant?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <form action={reviewPeladaJoinRequestFormAction}>
      <input type="hidden" name="request_id" value={requestId} />
      <input type="hidden" name="pelada_id" value={peladaId} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="member_type" value={memberType} />
      <button
        className={
          variant === "danger"
            ? "inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
            : "inline-flex items-center gap-1.5 rounded-xl border border-field-200 bg-field-50 px-3 py-2 text-xs font-semibold text-field-800 hover:bg-field-100"
        }
      >
        {children}
      </button>
    </form>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white px-2.5 py-1">{children}</span>;
}

function PeladaNavLink({
  href,
  icon: Icon,
  label
}: {
  href: string;
  icon: typeof CalendarDays;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-semibold text-slate-100 hover:bg-white/10 hover:text-white"
    >
      <Icon size={17} className="text-field-200" />
      {label}
    </Link>
  );
}

function Row({ label, value, highlight = false }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-3 py-3 text-sm">
      <span className="text-slate-600">{label}</span>
      <strong className={highlight ? "text-field-700" : "text-slate-900"}>{value}</strong>
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
  if (manageable && currentBalance < 0) alerts.push("O saldo atual da pelada está negativo.");
  if (manageable && pendingChargeCount > 0) alerts.push(`Existem ${pendingChargeCount} pendência(s) financeira(s) em aberto.`);

  if (nextRound) {
    const minimumConfirmed = nextRound.player_limit ? Math.max(1, Math.ceil(nextRound.player_limit / 2)) : 6;
    if (nextRoundPresence.confirmed < minimumConfirmed) {
      alerts.push("A próxima rodada ainda tem poucos confirmados.");
    }
    if (nextRoundPresence.pending > 0) {
      alerts.push(`Ainda há ${nextRoundPresence.pending} membro(s) sem responder a próxima rodada.`);
    }
  }

  return alerts;
}

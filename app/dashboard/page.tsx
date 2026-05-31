import Link from "next/link";
import { Bell, CalendarPlus, CircleDollarSign, Plus, ShieldCheck, UsersRound } from "lucide-react";
import { ChargePaymentForm } from "@/components/charge-payment-form";
import { Card, CardTitle, EmptyState, LinkButton, PageHeader, Stat } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { brl, competenceLabel, dateLabel, memberRoleLabel } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("pelada_members")
    .select("role, peladas(id, name, venue)")
    .eq("user_id", user.id);

  const peladaIds = memberships?.map((row: any) => row.peladas?.id).filter(Boolean) ?? [];
  const adminPeladaIds = memberships
    ?.filter((row: any) => row.role === "owner" || row.role === "admin")
    .map((row: any) => row.peladas?.id)
    .filter(Boolean) ?? [];

  const { data: rounds } = peladaIds.length
    ? await supabase
        .from("rounds")
        .select("id, title, round_date, starts_at, peladas(name)")
        .in("pelada_id", peladaIds)
        .gte("round_date", new Date().toISOString().slice(0, 10))
        .order("round_date")
        .limit(5)
    : { data: [] };

  const { data: myCharges } = await supabase
    .from("player_charges")
    .select("*, peladas(name)")
    .eq("user_id", user.id)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const chargeIds = myCharges?.map((charge: any) => charge.id) ?? [];
  const { data: myPayments } = chargeIds.length
    ? await supabase
        .from("player_payments")
        .select("id, charge_id, status, rejection_reason")
        .in("charge_id", chargeIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const { data: adminPayments } = adminPeladaIds.length
    ? await supabase
        .from("player_payments")
        .select("id, amount, status, pelada_id, user_id, charge_id")
        .in("pelada_id", adminPeladaIds)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
    : { data: [] };

  const adminPaymentUserIds = [...new Set((adminPayments ?? []).map((payment: any) => payment.user_id))];
  const adminPaymentChargeIds = [...new Set((adminPayments ?? []).map((payment: any) => payment.charge_id).filter(Boolean))];
  const { data: adminPaymentProfiles } = adminPaymentUserIds.length
    ? await supabase.from("profiles").select("id, name").in("id", adminPaymentUserIds)
    : { data: [] };
  const { data: adminPaymentCharges } = adminPaymentChargeIds.length
    ? await supabase.from("player_charges").select("id, description, competence").in("id", adminPaymentChargeIds)
    : { data: [] };

  const peladaName = new Map((memberships ?? []).map((row: any) => [row.peladas?.id, row.peladas?.name]));
  const profileName = new Map((adminPaymentProfiles ?? []).map((profile: any) => [profile.id, profile.name]));
  const chargeById = new Map((adminPaymentCharges ?? []).map((charge: any) => [charge.id, charge]));
  const paymentsByCharge = new Map<string, any[]>();
  (myPayments ?? []).forEach((payment: any) => {
    paymentsByCharge.set(payment.charge_id, [...(paymentsByCharge.get(payment.charge_id) ?? []), payment]);
  });

  return (
    <>
      <section className="surface-dark px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-kicker text-field-200">Seu centro de controle</p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white">Painel</h1>
            <p className="mt-3 text-base leading-7 text-slate-200">
              Veja suas peladas, próximas rodadas, cobranças e aprovações num resumo rápido para tocar a semana.
            </p>
          </div>
          <LinkButton href="/peladas/nova">
            <Plus size={16} />
            Criar pelada
          </LinkButton>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Peladas" value={memberships?.length ?? 0} description="Grupos em que você participa" />
        <Stat label="Próximas rodadas" value={rounds?.length ?? 0} description="Rodadas futuras no radar" />
        <Stat label="Cobranças abertas" value={myCharges?.length ?? 0} description="Pendências para você resolver" />
        <Stat label="Pagamentos para aprovar" value={adminPayments?.length ?? 0} description="Envios aguardando revisão" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle icon={Bell}>Notificações financeiras</CardTitle>
          <div className="mt-4 space-y-4">
            {myCharges?.map((charge: any) => {
              const chargePayments = paymentsByCharge.get(charge.id) ?? [];
              const rejected = chargePayments.find((payment: any) => payment.status === "rejected");
              const pending = chargePayments.find((payment: any) => payment.status === "pending");

              return (
                <div key={charge.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-field-50 text-field-700">
                      <CircleDollarSign size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">
                        {charge.peladas?.name}: {charge.description}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {brl(charge.amount)} • competência {competenceLabel(charge.competence)}
                      </p>
                      {charge.pix_code ? <p className="mt-2 rounded-xl bg-white px-3 py-2 text-xs text-slate-700">Pix: {charge.pix_code}</p> : null}
                      {pending ? <p className="mt-2 text-sm text-slate-600">Pagamento enviado e aguardando aprovação.</p> : null}
                      {rejected ? <p className="mt-2 text-sm text-red-700">Pagamento rejeitado: {rejected.rejection_reason ?? "sem motivo informado"}</p> : null}
                    </div>
                  </div>
                  {!pending ? <ChargePaymentForm chargeId={charge.id} amount={charge.amount} /> : null}
                </div>
              );
            })}
            {!myCharges?.length ? <p className="text-sm text-slate-600">Nenhuma cobrança aberta.</p> : null}
          </div>
        </Card>

        <Card>
          <CardTitle icon={ShieldCheck}>Aprovações pendentes</CardTitle>
          <div className="mt-4 space-y-3">
            {adminPayments?.map((payment: any) => (
              <Link key={payment.id} href={`/peladas/${payment.pelada_id}/financeiro`} className="block rounded-2xl border border-slate-200 p-4 hover:bg-slate-50">
                <p className="font-semibold text-slate-900">{profileName.get(payment.user_id) ?? "Jogador"} enviou pagamento</p>
                <p className="mt-1 text-sm text-slate-600">
                  {peladaName.get(payment.pelada_id)} • {chargeById.get(payment.charge_id)?.description ?? "Cobrança"} • {brl(payment.amount)}
                </p>
              </Link>
            ))}
            {!adminPayments?.length ? <p className="text-sm text-slate-600">Nenhum pagamento pendente de aprovação.</p> : null}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle icon={UsersRound}>Minhas peladas</CardTitle>
          <div className="mt-4 space-y-3">
            {!memberships?.length ? (
              <EmptyState title="Nenhuma pelada ainda" description="Crie a primeira pelada para começar." />
            ) : (
              memberships.map((row: any) => (
                <Link key={row.peladas.id} className="block rounded-2xl border border-slate-200 p-4 hover:bg-slate-50" href={`/peladas/${row.peladas.id}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">{row.peladas.name}</span>
                    <span className="rounded-full bg-field-50 px-2.5 py-1 text-xs font-semibold uppercase text-field-700">{memberRoleLabel(row.role)}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{row.peladas.venue ?? "Local não informado"}</p>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardTitle icon={CalendarPlus}>Próximas rodadas</CardTitle>
          <div className="mt-4 space-y-3">
            {!rounds?.length ? (
              <EmptyState title="Sem rodadas agendadas" />
            ) : (
              rounds.map((round: any) => (
                <Link key={round.id} href={`/rodadas/${round.id}`} className="block rounded-2xl border border-slate-200 p-4 hover:bg-slate-50">
                  <p className="font-semibold text-slate-900">{round.title ?? round.peladas.name}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {dateLabel(round.round_date)} às {round.starts_at.slice(0, 5)}
                  </p>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

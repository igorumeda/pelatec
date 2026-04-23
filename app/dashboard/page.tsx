import Link from "next/link";
import { CalendarPlus, CircleDollarSign, Plus } from "lucide-react";
import { ChargePaymentForm } from "@/components/charge-payment-form";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { brl, dateLabel } from "@/lib/utils";
import { EmptyState, LinkButton, PageHeader, Stat, Card } from "@/components/ui";

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
      <PageHeader
        title="Painel"
        description="Seu resumo de peladas, próximas rodadas e notificações."
        action={<LinkButton href="/peladas/nova"><Plus size={16} /> Criar pelada</LinkButton>}
      />
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Peladas" value={memberships?.length ?? 0} />
        <Stat label="Próximas rodadas" value={rounds?.length ?? 0} />
        <Stat label="Cobranças abertas" value={myCharges?.length ?? 0} />
        <Stat label="Pagamentos para aprovar" value={adminPayments?.length ?? 0} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Notificações financeiras</h2>
          <div className="mt-4 space-y-4">
            {myCharges?.map((charge: any) => {
              const chargePayments = paymentsByCharge.get(charge.id) ?? [];
              const rejected = chargePayments.find((payment: any) => payment.status === "rejected");
              const pending = chargePayments.find((payment: any) => payment.status === "pending");
              return (
                <div key={charge.id} className="rounded-md border border-zinc-200 p-4">
                  <div className="flex items-start gap-3">
                    <CircleDollarSign className="mt-1 text-field-700" size={18} />
                    <div>
                      <p className="font-medium">{charge.peladas?.name}: {charge.description}</p>
                      <p className="text-sm text-zinc-600">{brl(charge.amount)} - competência {charge.competence ?? "sem competência"}</p>
                      {charge.pix_code ? <p className="mt-2 rounded-md bg-zinc-50 p-2 text-xs text-zinc-700">Pix: {charge.pix_code}</p> : null}
                      {pending ? <p className="mt-2 text-sm text-zinc-600">Pagamento enviado e aguardando aprovação.</p> : null}
                      {rejected ? <p className="mt-2 text-sm text-red-700">Pagamento rejeitado: {rejected.rejection_reason ?? "sem motivo informado"}</p> : null}
                    </div>
                  </div>
                  {!pending ? <ChargePaymentForm chargeId={charge.id} amount={charge.amount} /> : null}
                </div>
              );
            })}
            {!myCharges?.length ? <p className="text-sm text-zinc-600">Nenhuma cobrança aberta.</p> : null}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold">Aprovações pendentes</h2>
          <div className="mt-4 space-y-3">
            {adminPayments?.map((payment: any) => (
              <Link key={payment.id} href={`/peladas/${payment.pelada_id}/financeiro`} className="block rounded-md border border-zinc-200 p-4 hover:bg-zinc-50">
                <p className="font-medium">{profileName.get(payment.user_id) ?? "Jogador"} enviou pagamento</p>
                <p className="text-sm text-zinc-600">{peladaName.get(payment.pelada_id)} - {chargeById.get(payment.charge_id)?.description ?? "Cobrança"} - {brl(payment.amount)}</p>
              </Link>
            ))}
            {!adminPayments?.length ? <p className="text-sm text-zinc-600">Nenhum pagamento pendente de aprovação.</p> : null}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Minhas peladas</h2>
          <div className="mt-4 space-y-3">
            {!memberships?.length ? (
              <EmptyState title="Nenhuma pelada ainda" description="Crie a primeira pelada para começar." />
            ) : (
              memberships.map((row: any) => (
                <Link key={row.peladas.id} className="block rounded-md border border-zinc-200 p-4 hover:bg-zinc-50" href={`/peladas/${row.peladas.id}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{row.peladas.name}</span>
                    <span className="text-xs uppercase text-zinc-500">{row.role}</span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">{row.peladas.venue ?? "Local não informado"}</p>
                </Link>
              ))
            )}
          </div>
        </Card>
        <Card>
          <h2 className="flex items-center gap-2 font-semibold"><CalendarPlus size={18} /> Próximas rodadas</h2>
          <div className="mt-4 space-y-3">
            {!rounds?.length ? (
              <EmptyState title="Sem rodadas agendadas" />
            ) : (
              rounds.map((round: any) => (
                <Link key={round.id} href={`/rodadas/${round.id}`} className="block rounded-md border border-zinc-200 p-4 hover:bg-zinc-50">
                  <p className="font-medium">{round.title ?? round.peladas.name}</p>
                  <p className="text-sm text-zinc-600">{dateLabel(round.round_date)} às {round.starts_at.slice(0, 5)}</p>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

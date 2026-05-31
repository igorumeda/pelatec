import { Banknote, BellRing, Check, CircleDollarSign, ClipboardList, Landmark, ReceiptText, WalletCards, X } from "lucide-react";
import { redirect } from "next/navigation";
import { cancelChargeAction, cancelPaymentAction, createFinancialEntryAction, reviewPaymentFormAction } from "@/app/actions";
import { ActionStateForm } from "@/components/action-state-form";
import { BulkChargeForm } from "@/components/bulk-charge-form";
import { FinanceTabs } from "@/components/finance-tabs";
import { BackLink, Card, CardTitle, Field, PageHeader, Stat } from "@/components/ui";
import { canManage, getMyRole, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { brl, chargeStatusLabel, competenceLabel, dateLabel } from "@/lib/utils";

export default async function FinancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const role = await getMyRole(id);
  if (!canManage(role)) redirect(`/peladas/${id}`);

  const supabase = await createClient();
  const { data: members } = await supabase.from("pelada_members").select("user_id, profiles(name)").eq("pelada_id", id).order("created_at");
  const { data: entries } = await supabase.from("financial_entries").select("*").eq("pelada_id", id).order("entry_date", { ascending: false });
  const { data: charges } = await supabase.from("player_charges").select("*").eq("pelada_id", id).order("created_at", { ascending: false });
  const { data: payments } = await supabase.from("player_payments").select("*").eq("pelada_id", id).order("created_at", { ascending: false });

  const entryBalance = (entries ?? []).reduce((sum: number, e: any) => sum + (e.type === "revenue" ? Number(e.amount) : -Number(e.amount)), 0);
  const chargeOpen = (charges ?? []).filter((c: any) => c.status === "open").reduce((sum: number, c: any) => sum + Number(c.amount), 0);
  const approvedPayments = (payments ?? []).filter((p: any) => p.status === "approved");
  const paymentTotal = approvedPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const pendingPayments = (payments ?? []).filter((p: any) => p.status === "pending");
  const totalBalance = entryBalance + paymentTotal;
  const grouped = groupByCompetence(charges ?? [], payments ?? [], entries ?? []);
  const chargeMembers = (members ?? []).map((member: any) => ({
    user_id: member.user_id,
    profiles: Array.isArray(member.profiles) ? member.profiles[0] : member.profiles
  }));
  const memberName = new Map(chargeMembers.map((member: any) => [member.user_id, member.profiles?.name ?? "Jogador"]));
  const chargeById = new Map((charges ?? []).map((charge: any) => [charge.id, charge]));
  const proofLinks = new Map<string, string>();

  for (const payment of pendingPayments) {
    if (!payment.proof_url) continue;
    const shouldOpenInline = isInlineProof(payment.proof_url);
    const { data } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrl(payment.proof_url, 60 * 10, {
        download: shouldOpenInline ? undefined : getFileName(payment.proof_url)
      });
    if (data?.signedUrl) proofLinks.set(payment.id, data.signedUrl);
  }

  return (
    <>
      <div className="mb-4">
        <BackLink href={`/peladas/${id}`}>Voltar para a pelada</BackLink>
      </div>
      <PageHeader title="Financeiro" description="Cobrancas, pagamentos, despesas e saldo por competencia." theme="dark" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Saldo de lancamentos" value={brl(entryBalance)} />
        <Stat label="Pagamentos aprovados" value={brl(paymentTotal)} />
        <Stat label="Saldo geral" value={brl(totalBalance)} />
        <Stat label="Cobrancas abertas" value={brl(chargeOpen)} />
        <Stat label="Pagamentos pendentes" value={pendingPayments.length} />
      </div>

      <Card className="mt-6">
        <CardTitle icon={ReceiptText}>Relatorio por competencia</CardTitle>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-2xl border border-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-700">
              <tr>
                <th className="border-b border-slate-200 px-4 py-3 font-semibold">Competencia</th>
                <th className="border-b border-slate-200 px-4 py-3 font-semibold">Cobrado</th>
                <th className="border-b border-slate-200 px-4 py-3 font-semibold">Pago</th>
                <th className="border-b border-slate-200 px-4 py-3 font-semibold">Despesas</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([competence, group]) => (
                <tr key={competence} className="bg-white">
                  <td className="border-b border-slate-100 px-4 py-3 font-medium text-slate-900">{competenceLabel(competence)}</td>
                  <td className="border-b border-slate-100 px-4 py-3 text-slate-700">{brl(group.charged)}</td>
                  <td className="border-b border-slate-100 px-4 py-3 font-medium text-field-700">{brl(group.paid)}</td>
                  <td className="border-b border-slate-100 px-4 py-3 font-medium text-red-700">{brl(group.expenses)}</td>
                </tr>
              ))}
              {!Object.keys(grouped).length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">Nenhum dado agrupado por competencia ainda.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <FinanceTabs
        accounting={
          <div className="grid gap-6">
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card>
                <CardTitle icon={Landmark}>Receita ou despesa</CardTitle>
                <ActionStateForm action={createFinancialEntryAction} submitLabel="Salvar lancamento" className="mt-4 space-y-4">
                  <input type="hidden" name="pelada_id" value={id} />
                  <Field label="Tipo"><select name="type"><option value="revenue">Receita</option><option value="expense">Despesa</option></select></Field>
                  <Field label="Descricao"><input name="description" required placeholder="Aluguel do campo" /></Field>
                  <Field label="Data"><input name="entry_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
                  <Field label="Valor"><input name="amount" type="number" min="0.01" step="0.01" required /></Field>
                  <Field label="Observacao"><textarea name="notes" rows={2} /></Field>
                </ActionStateForm>
              </Card>

              <Card>
                <CardTitle icon={ClipboardList}>Resumo dos lancamentos</CardTitle>
                <div className="mt-4 space-y-2">
                  {entries?.slice(0, 5).map((entry: any) => (
                    <div key={entry.id} className="flex justify-between gap-3 rounded-2xl border border-slate-200 p-3 text-sm">
                      <span className="text-slate-700">{entry.description}<br /><span className="text-slate-500">{dateLabel(entry.entry_date)}</span></span>
                      <strong className={entry.type === "revenue" ? "text-field-700" : "text-red-600"}>{entry.type === "revenue" ? "+" : "-"}{brl(entry.amount)}</strong>
                    </div>
                  ))}
                  {!entries?.length ? <p className="text-sm text-slate-600">Nenhum lancamento ainda.</p> : null}
                </div>
              </Card>
            </div>

            <Card>
              <CardTitle icon={Banknote}>Lancamentos</CardTitle>
              <div className="mt-4 space-y-2">
                {entries?.map((entry: any) => (
                  <div key={entry.id} className="flex justify-between gap-3 rounded-2xl border border-slate-200 p-3 text-sm">
                    <span className="text-slate-700">{entry.description}<br /><span className="text-slate-500">{dateLabel(entry.entry_date)}</span></span>
                    <strong className={entry.type === "revenue" ? "text-field-700" : "text-red-600"}>{entry.type === "revenue" ? "+" : "-"}{brl(entry.amount)}</strong>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        }
        charges={
          <div className="grid gap-6">
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card>
                <CardTitle icon={CircleDollarSign}>Nova cobranca em lote</CardTitle>
                <BulkChargeForm peladaId={id} members={chargeMembers} />
              </Card>

              <Card>
                <CardTitle icon={BellRing}>Pagamentos aguardando aprovacao</CardTitle>
                <div className="mt-4 space-y-3">
                  {pendingPayments.map((payment: any) => (
                    <div key={payment.id} className="rounded-2xl border border-slate-200 p-3 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <strong className="text-slate-900">{memberName.get(payment.user_id) ?? "Jogador"}</strong>
                          <p className="text-slate-600">{chargeById.get(payment.charge_id)?.description ?? "Cobranca"} - {brl(payment.amount)}</p>
                          {payment.proof_url ? (
                            proofLinks.get(payment.id) ? (
                              <a className="mt-2 inline-flex text-xs font-semibold text-field-700 hover:underline" href={proofLinks.get(payment.id)} target="_blank" rel="noreferrer">
                                Abrir comprovante
                              </a>
                            ) : (
                              <p className="text-xs text-slate-500">Comprovante indisponivel</p>
                            )
                          ) : null}
                          {payment.notes ? <p className="text-xs text-slate-500">{payment.notes}</p> : null}
                        </div>
                        <div className="flex gap-2">
                          <form action={reviewPaymentFormAction}>
                            <input type="hidden" name="payment_id" value={payment.id} />
                            <input type="hidden" name="pelada_id" value={id} />
                            <input type="hidden" name="status" value="approved" />
                            <button className="rounded-xl bg-field-600 p-2 text-white" aria-label="Aprovar"><Check size={16} /></button>
                          </form>
                          <form action={reviewPaymentFormAction}>
                            <input type="hidden" name="payment_id" value={payment.id} />
                            <input type="hidden" name="pelada_id" value={id} />
                            <input type="hidden" name="status" value="rejected" />
                            <button className="rounded-xl bg-red-600 p-2 text-white" aria-label="Rejeitar"><X size={16} /></button>
                          </form>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!pendingPayments.length ? <p className="text-sm text-slate-600">Nenhum pagamento pendente.</p> : null}
                </div>
              </Card>
            </div>

            <Card>
              <CardTitle icon={Check}>Pagamentos efetuados</CardTitle>
              <div className="mt-4 space-y-2">
                {approvedPayments.map((payment: any) => (
                  <div key={payment.id} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 p-3 text-sm">
                    <div>
                      <strong className="text-slate-900">{memberName.get(payment.user_id) ?? "Jogador"}</strong>
                      <p className="text-slate-600">
                        {chargeById.get(payment.charge_id)?.description ?? "Pagamento avulso"} - {brl(payment.amount)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Pago em {dateLabel(payment.paid_at)}
                      </p>
                      {payment.notes ? <p className="mt-1 text-xs text-slate-500">{payment.notes}</p> : null}
                    </div>
                    <form action={cancelPaymentAction}>
                      <input type="hidden" name="payment_id" value={payment.id} />
                      <input type="hidden" name="pelada_id" value={id} />
                      <button className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">
                        Cancelar
                      </button>
                    </form>
                  </div>
                ))}
                {!approvedPayments.length ? <p className="text-sm text-slate-600">Nenhum pagamento efetuado ainda.</p> : null}
              </div>
            </Card>

            <Card>
              <CardTitle icon={WalletCards}>Cobrancas criadas</CardTitle>
              <div className="mt-4 space-y-2">
                {charges?.map((charge: any) => (
                  <div key={charge.id} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 p-3 text-sm">
                    <div>
                      <strong className="text-slate-900">{memberName.get(charge.user_id) ?? "Jogador"}</strong> - <span className="text-slate-700">{charge.description}</span>
                      <p className="text-slate-600">{brl(charge.amount)} - competencia {competenceLabel(charge.competence)}</p>
                      <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase text-slate-700">
                        {chargeStatusLabel(charge.status)}
                      </span>
                    </div>
                    {charge.status !== "cancelled" ? (
                      <form action={cancelChargeAction}>
                        <input type="hidden" name="charge_id" value={charge.id} />
                        <input type="hidden" name="pelada_id" value={id} />
                        <button className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">
                          Cancelar
                        </button>
                      </form>
                    ) : null}
                  </div>
                ))}
                {!charges?.length ? <p className="text-sm text-slate-600">Nenhuma cobranca criada.</p> : null}
              </div>
            </Card>
          </div>
        }
      />
    </>
  );
}

function isInlineProof(path: string) {
  return /\.(png|jpe?g|webp|gif|pdf)$/i.test(path);
}

function getFileName(path: string) {
  return path.split("/").pop() || "comprovante";
}

function groupByCompetence(charges: any[], payments: any[], entries: any[]) {
  const result: Record<string, { charged: number; paid: number; expenses: number }> = {};
  const ensure = (key: string) => result[key] ??= { charged: 0, paid: 0, expenses: 0 };

  charges.forEach((charge) => {
    ensure(charge.competence ?? "Sem competencia").charged += Number(charge.amount);
  });
  const chargesById = new Map(charges.map((charge) => [charge.id, charge]));
  payments.filter((payment) => payment.status === "approved").forEach((payment) => {
    ensure(chargesById.get(payment.charge_id)?.competence ?? "Sem competencia").paid += Number(payment.amount);
  });
  entries.filter((entry) => entry.type === "expense").forEach((entry) => {
    ensure(entry.entry_date?.slice(0, 7) ?? "Sem competencia").expenses += Number(entry.amount);
  });

  return result;
}

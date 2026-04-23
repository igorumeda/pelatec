"use client";

import { useActionState, useMemo, useState } from "react";
import { createBulkChargesAction } from "@/app/actions";
import { Button, Field } from "@/components/ui";

type Member = {
  user_id: string;
  profiles?: { name?: string | null } | null;
};

const months = [
  ["01", "Janeiro"],
  ["02", "Fevereiro"],
  ["03", "Março"],
  ["04", "Abril"],
  ["05", "Maio"],
  ["06", "Junho"],
  ["07", "Julho"],
  ["08", "Agosto"],
  ["09", "Setembro"],
  ["10", "Outubro"],
  ["11", "Novembro"],
  ["12", "Dezembro"]
];

export function BulkChargeForm({ peladaId, members }: { peladaId: string; members: Member[] }) {
  const [state, action] = useActionState(createBulkChargesAction, null);
  const [selected, setSelected] = useState<string[]>(members.map((member) => member.user_id));
  const allSelected = selected.length === members.length && members.length > 0;
  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return [current - 1, current, current + 1];
  }, []);

  function toggleAll() {
    setSelected(allSelected ? [] : members.map((member) => member.user_id));
  }

  function toggleUser(userId: string) {
    setSelected((current) => current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]);
  }

  return (
    <form action={action} className="mt-4 space-y-4">
      <input type="hidden" name="pelada_id" value={peladaId} />
      {selected.map((userId) => <input key={userId} type="hidden" name="user_ids" value={userId} />)}
      <Field label="Descrição"><input name="description" required placeholder="Mensalidade" /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Ano">
          <select name="competence_year" defaultValue={new Date().getFullYear()}>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </Field>
        <Field label="Mês">
          <select name="competence_month" defaultValue={String(new Date().getMonth() + 1).padStart(2, "0")}>
            {months.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Vencimento"><input name="due_date" type="date" /></Field>
      <Field label="Valor"><input name="amount" type="number" min="0.01" step="0.01" required /></Field>
      <Field label="Pix"><textarea name="pix_code" rows={2} placeholder="Chave Pix ou código copia e cola" /></Field>

      <div className="rounded-md border border-zinc-200 p-3">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input className="h-4 w-4" type="checkbox" checked={allSelected} onChange={toggleAll} />
          Selecionar/desselecionar todos
        </label>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {members.map((member) => (
            <label key={member.user_id} className="flex items-center gap-2 rounded-md bg-zinc-50 p-2 text-sm">
              <input
                className="h-4 w-4"
                type="checkbox"
                checked={selected.includes(member.user_id)}
                onChange={() => toggleUser(member.user_id)}
              />
              {member.profiles?.name ?? "Jogador"}
            </label>
          ))}
        </div>
      </div>
      {state?.message ? <p className={state.ok ? "text-sm text-field-700" : "text-sm text-red-600"}>{state.message}</p> : null}
      <Button type="submit">Criar cobranças</Button>
    </form>
  );
}

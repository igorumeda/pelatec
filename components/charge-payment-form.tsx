"use client";

import { useActionState } from "react";
import { submitPlayerPaymentAction } from "@/app/actions";
import { DateInput, todayIsoDate } from "@/components/date-input";
import { Button, Field } from "@/components/ui";

export function ChargePaymentForm({ chargeId, amount }: { chargeId: string; amount: string | number }) {
  const [state, action] = useActionState(submitPlayerPaymentAction, null);

  return (
    <form action={action} className="mt-3 space-y-3">
      <input type="hidden" name="charge_id" value={chargeId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Data">
          <DateInput name="paid_at" required defaultValue={todayIsoDate()} />
        </Field>
        <Field label="Valor">
          <input name="amount" type="number" min="0.01" step="0.01" required defaultValue={amount} />
        </Field>
      </div>
      <Field label="Comprovante">
        <input name="proof" type="file" accept="image/*,.pdf" />
      </Field>
      <Field label="Observação">
        <textarea name="notes" rows={2} />
      </Field>
      {state?.message ? <p className={state.ok ? "text-sm font-medium text-field-700" : "text-sm font-medium text-red-700"}>{state.message}</p> : null}
      <Button type="submit">Enviar pagamento</Button>
    </form>
  );
}

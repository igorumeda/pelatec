"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";

type State = { ok?: boolean; message?: string } | null | undefined;

export function ActionStateForm({
  action,
  children,
  submitLabel = "Salvar",
  className = "space-y-4"
}: {
  action: (state: State, formData: FormData) => Promise<State>;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className={className}>
      {children}
      {state?.message ? (
        <p className={state.ok ? "text-sm text-field-700" : "text-sm text-red-600"}>{state.message}</p>
      ) : null}
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}

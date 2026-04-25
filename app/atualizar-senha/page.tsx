import { KeyRound } from "lucide-react";
import { updatePasswordAction } from "@/app/actions";
import { ActionStateForm } from "@/components/action-state-form";
import { Card, CardTitle, Field, PageHeader } from "@/components/ui";

export default function UpdatePasswordPage() {
  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Nova senha" description="Crie uma nova senha para continuar usando sua conta." />
      <Card>
        <CardTitle icon={KeyRound}>Atualizar senha</CardTitle>
        <ActionStateForm action={updatePasswordAction} submitLabel="Atualizar senha">
          <Field label="Nova senha">
            <input name="password" type="password" minLength={6} required autoComplete="new-password" />
          </Field>
        </ActionStateForm>
      </Card>
    </div>
  );
}

import { updatePasswordAction } from "@/app/actions";
import { ActionStateForm } from "@/components/action-state-form";
import { Card, Field, PageHeader } from "@/components/ui";

export default function UpdatePasswordPage() {
  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Nova senha" description="Crie uma nova senha para continuar usando sua conta." />
      <Card>
        <ActionStateForm action={updatePasswordAction} submitLabel="Atualizar senha">
          <Field label="Nova senha">
            <input name="password" type="password" minLength={6} required autoComplete="new-password" />
          </Field>
        </ActionStateForm>
      </Card>
    </div>
  );
}

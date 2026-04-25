import Link from "next/link";
import { MailSearch } from "lucide-react";
import { recoverPasswordAction } from "@/app/actions";
import { ActionStateForm } from "@/components/action-state-form";
import { Card, CardTitle, Field, PageHeader } from "@/components/ui";

export default function RecoverPasswordPage() {
  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Recuperar senha" description="Informe seu e-mail para receber o link de redefinicao." />
      <Card>
        <CardTitle icon={MailSearch}>Recuperacao de acesso</CardTitle>
        <ActionStateForm action={recoverPasswordAction} submitLabel="Enviar link">
          <Field label="E-mail">
            <input name="email" type="email" required autoComplete="email" />
          </Field>
        </ActionStateForm>
        <p className="mt-4 text-sm text-zinc-600">
          Lembrou a senha? <Link className="font-semibold text-field-700" href="/login">Entrar</Link>
        </p>
      </Card>
    </div>
  );
}

import Link from "next/link";
import { MailSearch } from "lucide-react";
import { recoverPasswordAction } from "@/app/actions";
import { ActionStateForm } from "@/components/action-state-form";
import { BackLink, Card, CardTitle, Field, PageHeader } from "@/components/ui";

export default function RecoverPasswordPage() {
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4">
        <BackLink href="/login">Voltar para entrar</BackLink>
      </div>
      <PageHeader title="Recuperar senha" description="Informe seu e-mail para receber o link de redefinicao." theme="dark" />
      <Card>
        <CardTitle icon={MailSearch}>Recuperacao de acesso</CardTitle>
        <ActionStateForm action={recoverPasswordAction} submitLabel="Enviar link">
          <Field label="E-mail">
            <input name="email" type="email" required autoComplete="email" />
          </Field>
        </ActionStateForm>
        <p className="mt-4 text-sm text-slate-600">
          Lembrou a senha? <Link className="font-semibold text-field-700 hover:text-field-600" href="/login">Entrar</Link>
        </p>
      </Card>
    </div>
  );
}

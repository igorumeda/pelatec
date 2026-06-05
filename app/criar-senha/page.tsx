import { KeyRound } from "lucide-react";
import { updatePasswordAction } from "@/app/actions";
import { ActionStateForm } from "@/components/action-state-form";
import { BackLink, Card, CardTitle, Field, PageHeader } from "@/components/ui";

export default function CreatePasswordPage() {
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4">
        <BackLink href="/login">Voltar para entrar</BackLink>
      </div>
      <PageHeader title="Criar senha" description="Sua conta já foi confirmada. Agora escolha uma senha para entrar com e-mail e senha." theme="dark" />
      <Card>
        <CardTitle icon={KeyRound}>Definir senha</CardTitle>
        <ActionStateForm action={updatePasswordAction} submitLabel="Salvar senha">
          <Field label="Nova senha">
            <input name="password" type="password" minLength={6} required autoComplete="new-password" />
          </Field>
        </ActionStateForm>
      </Card>
    </div>
  );
}

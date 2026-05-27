import { KeyRound } from "lucide-react";
import { updatePasswordAction } from "@/app/actions";
import { ActionStateForm } from "@/components/action-state-form";
import { BackLink, Card, CardTitle, Field, PageHeader } from "@/components/ui";

export default function CreatePasswordPage() {
  return (
    <div className="mx-auto max-w-md">
      <PageHeader
        title="Criar senha"
        description="Sua conta ja foi confirmada. Agora escolha uma senha para entrar com e-mail e senha."
        action={<BackLink href="/login">Voltar para entrar</BackLink>}
      />
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

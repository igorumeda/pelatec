import Link from "next/link";
import { UserPlus } from "lucide-react";
import { signUpAction } from "@/app/actions";
import { ActionStateForm } from "@/components/action-state-form";
import { BackLink, Card, CardTitle, Field, PageHeader } from "@/components/ui";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md">
      <PageHeader
        title="Criar conta"
        description="Seu perfil sera usado nas peladas em que voce participa."
        action={<BackLink href="/">Voltar ao inicio</BackLink>}
      />
      <Card>
        <CardTitle icon={UserPlus}>Cadastro</CardTitle>
        <ActionStateForm action={signUpAction} submitLabel="Criar conta">
          <Field label="Nome">
            <input name="name" required autoComplete="name" />
          </Field>
          <Field label="E-mail">
            <input name="email" type="email" required autoComplete="email" />
          </Field>
          <Field label="Senha">
            <input name="password" type="password" minLength={6} required autoComplete="new-password" />
          </Field>
        </ActionStateForm>
        <p className="mt-4 text-sm text-zinc-600">
          Ja tem conta? <Link className="font-semibold text-field-700" href="/login">Entrar</Link>
        </p>
      </Card>
    </div>
  );
}

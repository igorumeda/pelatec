import Link from "next/link";
import { ActionStateForm } from "@/components/action-state-form";
import { Field, Card, PageHeader } from "@/components/ui";
import { signUpAction } from "@/app/actions";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Criar conta" description="Seu perfil será usado nas peladas em que você participa." />
      <Card>
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
          Já tem conta? <Link className="font-semibold text-field-700" href="/login">Entrar</Link>
        </p>
      </Card>
    </div>
  );
}

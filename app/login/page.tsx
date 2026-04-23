import Link from "next/link";
import { ActionStateForm } from "@/components/action-state-form";
import { Field, Card, PageHeader } from "@/components/ui";
import { signInAction } from "@/app/actions";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Entrar" description="Acesse sua conta para administrar suas peladas." />
      <Card>
        <ActionStateForm action={signInAction} submitLabel="Entrar">
          <Field label="E-mail">
            <input name="email" type="email" required autoComplete="email" />
          </Field>
          <Field label="Senha">
            <input name="password" type="password" required autoComplete="current-password" />
          </Field>
        </ActionStateForm>
        <p className="mt-4 text-sm text-zinc-600">
          Ainda não tem conta? <Link className="font-semibold text-field-700" href="/signup">Criar conta</Link>
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          Esqueceu a senha? <Link className="font-semibold text-field-700" href="/recuperar-senha">Recuperar acesso</Link>
        </p>
      </Card>
    </div>
  );
}

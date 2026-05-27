import Link from "next/link";
import { Mail, UserPlus } from "lucide-react";
import { signUpAction } from "@/app/actions";
import { ActionStateForm } from "@/components/action-state-form";
import { BackLink, Card, CardTitle, Field, PageHeader } from "@/components/ui";
import { GoogleAuthButton } from "@/components/google-auth-button";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md">
      <PageHeader
        title="Criar conta"
        description="Informe seus dados para receber um codigo de confirmacao por e-mail."
        action={<BackLink href="/">Voltar ao inicio</BackLink>}
      />
      <Card>
        <CardTitle icon={UserPlus}>Cadastro</CardTitle>
        <ActionStateForm action={signUpAction} submitLabel="Enviar codigo">
          <Field label="Nome">
            <input name="name" required autoComplete="name" />
          </Field>
          <Field label="E-mail">
            <input name="email" type="email" required autoComplete="email" />
          </Field>
        </ActionStateForm>

        <div className="my-4 flex items-center gap-3 text-xs uppercase text-zinc-400">
          <span className="h-px flex-1 bg-zinc-200" />
          ou
          <span className="h-px flex-1 bg-zinc-200" />
        </div>

        <GoogleAuthButton />

        <p className="mt-4 text-sm text-zinc-600">
          Ja tem conta? <Link className="font-semibold text-field-700" href="/login">Entrar</Link>
        </p>
        <p className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
          <Mail size={14} />
          Depois de confirmar o codigo, voce cria sua senha.
        </p>
      </Card>
    </div>
  );
}

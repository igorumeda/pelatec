import Link from "next/link";
import { LogIn } from "lucide-react";
import { signInAction } from "@/app/actions";
import { ActionStateForm } from "@/components/action-state-form";
import { BackLink, Card, CardTitle, Field, PageHeader } from "@/components/ui";
import { GoogleAuthButton } from "@/components/google-auth-button";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <PageHeader
        title="Entrar"
        description="Acesse sua conta para administrar suas peladas."
      />
      <Card>
        <CardTitle icon={LogIn}>Acesso</CardTitle>
        <ActionStateForm action={signInAction} submitLabel="Entrar">
          <Field label="E-mail">
            <input name="email" type="email" required autoComplete="email" />
          </Field>
          <Field label="Senha">
            <input name="password" type="password" required autoComplete="current-password" />
          </Field>
        </ActionStateForm>

        <div className="my-4 flex items-center gap-3 text-xs uppercase text-zinc-400">
          <span className="h-px flex-1 bg-zinc-200" />
          ou
          <span className="h-px flex-1 bg-zinc-200" />
        </div>

        <GoogleAuthButton />

        <p className="mt-4 text-sm text-zinc-600">
          Ainda nao tem conta? <Link className="font-semibold text-field-700" href="/signup">Criar conta</Link>
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          Esqueceu a senha? <Link className="font-semibold text-field-700" href="/recuperar-senha">Recuperar acesso</Link>
        </p>
      </Card>
    </div>
  );
}

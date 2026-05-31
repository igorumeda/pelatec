import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { verifySignupCodeAction } from "@/app/actions";
import { ActionStateForm } from "@/components/action-state-form";
import { BackLink, Card, CardTitle, Field, PageHeader } from "@/components/ui";

export default async function ConfirmSignupPage({
  searchParams
}: {
  searchParams: Promise<{ email?: string; name?: string }>;
}) {
  const params = await searchParams;
  const email = params.email ?? "";

  if (!email) redirect("/signup");

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4">
        <BackLink href="/signup">Voltar ao cadastro</BackLink>
      </div>
      <PageHeader title="Confirmar codigo" description={`Enviamos um codigo para ${email}.`} theme="dark" />
      <Card>
        <CardTitle icon={ShieldCheck}>Verificacao por e-mail</CardTitle>
        <ActionStateForm action={verifySignupCodeAction} submitLabel="Validar codigo">
          <input type="hidden" name="email" value={email} />
          <Field label="Codigo">
            <input name="token" inputMode="numeric" minLength={6} maxLength={6} required autoComplete="one-time-code" />
          </Field>
        </ActionStateForm>
      </Card>
    </div>
  );
}

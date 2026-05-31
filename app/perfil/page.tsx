import { UserCircle2 } from "lucide-react";
import { updateProfileAction } from "@/app/actions";
import { ActionStateForm } from "@/components/action-state-form";
import { BackLink, Card, CardTitle, Field, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4">
        <BackLink href="/dashboard">Voltar ao painel</BackLink>
      </div>
      <PageHeader title="Perfil" description="Atualize seus dados basicos de jogador." theme="dark" />
      <Card>
        <CardTitle icon={UserCircle2}>Dados do perfil</CardTitle>
        <ActionStateForm action={updateProfileAction}>
          <Field label="Nome">
            <input name="name" required defaultValue={profile?.name ?? ""} />
          </Field>
          <Field label="E-mail">
            <input value={profile?.email ?? user.email ?? ""} disabled />
          </Field>
          <Field label="Telefone">
            <input name="phone" defaultValue={profile?.phone ?? ""} />
          </Field>
          <Field label="Foto URL">
            <input name="avatar_url" defaultValue={profile?.avatar_url ?? ""} />
          </Field>
        </ActionStateForm>
      </Card>
    </div>
  );
}

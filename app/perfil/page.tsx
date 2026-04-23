import { updateProfileAction } from "@/app/actions";
import { ActionStateForm } from "@/components/action-state-form";
import { Card, Field, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Perfil" description="Atualize seus dados básicos de jogador." />
      <Card>
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

import { ShieldCheck, UserCircle2 } from "lucide-react";
import { updateProfileAction } from "@/app/actions";
import { ActionStateForm } from "@/components/action-state-form";
import { ProfileEditorFields } from "@/components/profile-editor-fields";
import { BackLink, Card, CardTitle, LinkButton, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4">
        <BackLink href="/dashboard">Voltar ao painel</BackLink>
      </div>
      <PageHeader
        title="Perfil"
        description="Atualize seu cartao de jogador, escolha suas habilidades iniciais e publique um perfil facil de compartilhar."
        theme="dark"
        action={
          profile?.username ? (
            <LinkButton href={`/${profile.username}`} variant="secondary" className="w-full sm:w-auto">
              <ShieldCheck size={16} />
              Ver perfil público
            </LinkButton>
          ) : null
        }
      />
      <Card>
        <CardTitle icon={UserCircle2}>Dados do perfil</CardTitle>
        <ActionStateForm action={updateProfileAction} className="space-y-5">
          <ProfileEditorFields profile={{ ...profile, email: profile?.email ?? user.email ?? "" }} />
        </ActionStateForm>
      </Card>
    </div>
  );
}

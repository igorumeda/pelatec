import { redirect } from "next/navigation";
import { UserRoundCheck } from "lucide-react";
import { updateProfileAction } from "@/app/actions";
import { ActionStateForm } from "@/components/action-state-form";
import { ProfileEditorFields } from "@/components/profile-editor-fields";
import { Card, CardTitle, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { isProfileComplete } from "@/lib/profile-completion";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (isProfileComplete(profile)) redirect("/dashboard");

  const metadataName =
    typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()
      ? user.user_metadata.name
      : typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()
        ? user.user_metadata.full_name
        : user.email?.split("@")[0] ?? "";
  const metadataAvatar =
    typeof user.user_metadata?.avatar_url === "string" && user.user_metadata.avatar_url.trim()
      ? user.user_metadata.avatar_url
      : typeof user.user_metadata?.picture === "string" && user.user_metadata.picture.trim()
        ? user.user_metadata.picture
        : null;

  const draftProfile = {
    ...profile,
    name: profile?.name ?? metadataName,
    email: profile?.email ?? user.email ?? "",
    avatar_url: profile?.avatar_url ?? metadataAvatar
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Configure seu perfil de jogador"
        description="Antes de entrar no sistema, complete seus dados públicos e distribua todos os 10 pontos de habilidade."
        theme="dark"
      />
      <Card>
        <CardTitle icon={UserRoundCheck}>Primeiros dados</CardTitle>
        <ActionStateForm action={updateProfileAction} className="space-y-5" submitLabel="Concluir e abrir painel">
          <input type="hidden" name="_redirect_to" value="/dashboard" />
          <ProfileEditorFields profile={draftProfile} />
        </ActionStateForm>
      </Card>
    </div>
  );
}

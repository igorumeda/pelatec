import { Settings } from "lucide-react";
import { redirect } from "next/navigation";
import { updatePeladaAction } from "@/app/actions";
import { ActionStateForm } from "@/components/action-state-form";
import { PeladaFormFields } from "@/components/pelada-form-fields";
import { BackLink, Card, CardTitle, PageHeader } from "@/components/ui";
import { canManage, getMyRole, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function EditPeladaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const role = await getMyRole(id);
  if (!canManage(role)) redirect(`/peladas/${id}`);
  const supabase = await createClient();
  const { data: pelada } = await supabase.from("peladas").select("*").eq("id", id).single();
  const action = updatePeladaAction.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <BackLink href={`/peladas/${id}`}>Voltar para a pelada</BackLink>
      </div>
      <PageHeader title="Editar pelada" theme="dark" />
      <Card>
        <CardTitle icon={Settings}>Configurações da pelada</CardTitle>
        <ActionStateForm action={action}>
          <PeladaFormFields pelada={pelada} />
        </ActionStateForm>
      </Card>
    </div>
  );
}

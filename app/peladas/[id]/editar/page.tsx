import { Settings } from "lucide-react";
import { redirect } from "next/navigation";
import { updatePeladaAction } from "@/app/actions";
import { ActionStateForm } from "@/components/action-state-form";
import { Card, CardTitle, Field, PageHeader } from "@/components/ui";
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
      <PageHeader title="Editar pelada" />
      <Card>
        <CardTitle icon={Settings}>Configuracoes da pelada</CardTitle>
        <ActionStateForm action={action}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Field label="Nome"><input name="name" required defaultValue={pelada?.name ?? ""} /></Field></div>
            <div className="sm:col-span-2"><Field label="Descricao"><textarea name="description" rows={3} defaultValue={pelada?.description ?? ""} /></Field></div>
            <Field label="Cidade"><input name="city" defaultValue={pelada?.city ?? ""} /></Field>
            <Field label="Bairro"><input name="neighborhood" defaultValue={pelada?.neighborhood ?? ""} /></Field>
            <div className="sm:col-span-2"><Field label="Local"><input name="venue" defaultValue={pelada?.venue ?? ""} /></Field></div>
            <Field label="Dias preferenciais"><input name="preferred_weekdays" defaultValue={pelada?.preferred_weekdays ?? ""} /></Field>
            <Field label="Horario padrao"><input name="default_time" type="time" defaultValue={pelada?.default_time?.slice(0, 5) ?? ""} /></Field>
            <Field label="Valor mensalista"><input name="monthly_fee" type="number" step="0.01" min="0" defaultValue={pelada?.monthly_fee ?? ""} /></Field>
            <Field label="Valor diarista"><input name="daily_fee" type="number" step="0.01" min="0" defaultValue={pelada?.daily_fee ?? ""} /></Field>
            <Field label="Status"><select name="status" defaultValue={pelada?.status ?? "active"}><option value="active">Ativa</option><option value="inactive">Inativa</option></select></Field>
          </div>
        </ActionStateForm>
      </Card>
    </div>
  );
}

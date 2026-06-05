import { ShieldPlus, UsersRound } from "lucide-react";
import { addMemberAction, updateMemberRoleFormAction } from "@/app/actions";
import { ActionStateForm } from "@/components/action-state-form";
import { BackLink, Card, CardTitle, Field, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { canManage, getMyRole, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { memberRoleLabel, memberTypeLabel } from "@/lib/utils";

export default async function MembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const role = await getMyRole(id);
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("pelada_members")
    .select("user_id, role, member_type, profiles(id, name, email, phone)")
    .eq("pelada_id", id)
    .order("created_at");

  return (
    <>
      <div className="mb-4">
        <BackLink href={`/peladas/${id}`}>Voltar para a pelada</BackLink>
      </div>
      <PageHeader title="Membros" description="Gerencie permissões e tipos de membro da pelada." theme="dark" />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardTitle icon={UsersRound}>Lista de membros</CardTitle>
          <div className="mt-4 space-y-3">
            {members?.map((member: any) => (
              <div key={member.user_id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-900">{member.profiles?.name}</p>
                  <p className="text-sm text-slate-600">{member.profiles?.email}</p>
                </div>
                {role === "owner" && member.role !== "owner" ? (
                  <form action={updateMemberRoleFormAction} className="flex gap-2">
                    <input type="hidden" name="pelada_id" value={id} />
                    <input type="hidden" name="user_id" value={member.user_id} />
                    <select name="role" defaultValue={member.role} className="w-36">
                      <option value="player">Membro comum</option>
                      <option value="admin">Administrador</option>
                    </select>
                    <select name="member_type" defaultValue={member.member_type ?? "monthly"} className="w-36">
                      <option value="monthly">Mensalista</option>
                      <option value="daily">Diarista</option>
                    </select>
                    <SubmitButton>Salvar</SubmitButton>
                  </form>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase text-slate-700">{memberRoleLabel(member.role)}</span>
                    <span className="rounded-full bg-field-50 px-2.5 py-1 text-xs font-semibold uppercase text-field-700">{memberTypeLabel(member.member_type)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {canManage(role) ? (
          <Card>
            <CardTitle icon={ShieldPlus}>Adicionar membro</CardTitle>
            <ActionStateForm action={addMemberAction} submitLabel="Adicionar" className="mt-4 space-y-4">
              <input type="hidden" name="pelada_id" value={id} />
              <Field label="E-mail do usuário">
                <input name="email" type="email" required />
              </Field>
              <Field label="Permissão">
                <select name="role" defaultValue="player">
                  <option value="player">Membro comum</option>
                  <option value="admin">Administrador</option>
                </select>
              </Field>
              <Field label="Tipo de membro">
                <select name="member_type" defaultValue="monthly">
                  <option value="monthly">Mensalista</option>
                  <option value="daily">Diarista</option>
                </select>
              </Field>
            </ActionStateForm>
          </Card>
        ) : null}
      </div>
    </>
  );
}

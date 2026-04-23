import { addMemberAction, updateMemberRoleFormAction } from "@/app/actions";
import { ActionStateForm } from "@/components/action-state-form";
import { Card, Field, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { canManage, getMyRole, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function MembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const role = await getMyRole(id);
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("pelada_members")
    .select("user_id, role, profiles(id, name, email, phone)")
    .eq("pelada_id", id)
    .order("created_at");

  return (
    <>
      <PageHeader title="Membros" description="Gerencie jogadores e administradores da pelada." />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <div className="space-y-3">
            {members?.map((member: any) => (
              <div key={member.user_id} className="flex flex-col gap-3 rounded-md border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{member.profiles?.name}</p>
                  <p className="text-sm text-zinc-600">{member.profiles?.email}</p>
                </div>
                {role === "owner" && member.role !== "owner" ? (
                  <form action={updateMemberRoleFormAction} className="flex gap-2">
                    <input type="hidden" name="pelada_id" value={id} />
                    <input type="hidden" name="user_id" value={member.user_id} />
                    <select name="role" defaultValue={member.role} className="w-32">
                      <option value="player">Player</option>
                      <option value="admin">Admin</option>
                    </select>
                    <SubmitButton>Salvar</SubmitButton>
                  </form>
                ) : (
                  <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs uppercase text-zinc-600">{member.role}</span>
                )}
              </div>
            ))}
          </div>
        </Card>
        {canManage(role) ? (
          <Card>
            <h2 className="font-semibold">Adicionar membro</h2>
            <ActionStateForm action={addMemberAction} submitLabel="Adicionar" className="mt-4 space-y-4">
              <input type="hidden" name="pelada_id" value={id} />
              <Field label="E-mail do usuário">
                <input name="email" type="email" required />
              </Field>
              <Field label="Papel">
                <select name="role" defaultValue="player">
                  <option value="player">Player</option>
                  <option value="admin">Admin</option>
                </select>
              </Field>
            </ActionStateForm>
          </Card>
        ) : null}
      </div>
    </>
  );
}

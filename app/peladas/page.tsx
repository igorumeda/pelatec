import Link from "next/link";
import { Plus, UsersRound } from "lucide-react";
import { BackLink, Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { brl, memberRoleLabel } from "@/lib/utils";

export default async function PeladasPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("pelada_members")
    .select("role, peladas(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        title="Peladas"
        description="Todas as peladas em que voce participa."
        action={
          <div className="flex flex-wrap gap-3">
            <BackLink href="/dashboard">Voltar ao painel</BackLink>
            <LinkButton href="/peladas/nova"><Plus size={16} /> Nova pelada</LinkButton>
          </div>
        }
      />
      {!data?.length ? (
        <EmptyState title="Voce ainda nao participa de uma pelada" description="Crie uma pelada ou peca para um administrador adicionar seu e-mail." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((row: any) => (
            <Link key={row.peladas.id} href={`/peladas/${row.peladas.id}`}>
              <Card className="h-full transition hover:border-field-500">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 font-semibold">
                      <UsersRound size={18} className="text-field-700" />
                      <span>{row.peladas.name}</span>
                    </h2>
                    <p className="mt-1 text-sm text-zinc-600">{row.peladas.venue ?? "Local nao informado"}</p>
                  </div>
                  <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs uppercase text-zinc-600">{memberRoleLabel(row.role)}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-zinc-600">
                  <span>{row.peladas.city ?? "Cidade nao informada"}</span>
                  <span>{row.peladas.monthly_fee ? brl(row.peladas.monthly_fee) : "Sem mensalidade"}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

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
      <section className="surface-dark px-6 py-7 sm:px-8">
        <PageHeader
          title="Peladas"
          description="Todas as peladas em que você participa, com contexto rápido para voltar ao que importa."
          action={
            <div className="flex flex-wrap gap-3">
              <BackLink href="/dashboard" className="border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white">
                Voltar ao painel
              </BackLink>
              <LinkButton href="/peladas/nova">
                <Plus size={16} />
                Nova pelada
              </LinkButton>
            </div>
          }
        />
      </section>

      {!data?.length ? (
        <div className="mt-6">
          <EmptyState title="Você ainda não participa de uma pelada" description="Crie uma pelada ou peça para um administrador adicionar seu e-mail." />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((row: any) => (
            <Link key={row.peladas.id} href={`/peladas/${row.peladas.id}`}>
              <Card className="h-full transition hover:-translate-y-0.5 hover:border-field-500/50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 font-semibold text-brand-950">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-field-50 text-field-700">
                        <UsersRound size={18} />
                      </span>
                      <span>{row.peladas.name}</span>
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">{row.peladas.venue ?? "Local não informado"}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase text-slate-600">{memberRoleLabel(row.role)}</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2 text-sm text-slate-600">
                  <span>{row.peladas.city ?? "Cidade não informada"}</span>
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

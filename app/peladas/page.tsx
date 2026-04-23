import Link from "next/link";
import { Plus } from "lucide-react";
import { EmptyState, LinkButton, PageHeader, Card } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { brl } from "@/lib/utils";

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
      <PageHeader title="Peladas" description="Todas as peladas em que você participa." action={<LinkButton href="/peladas/nova"><Plus size={16} /> Nova pelada</LinkButton>} />
      {!data?.length ? (
        <EmptyState title="Você ainda não participa de uma pelada" description="Crie uma pelada ou peça para um administrador adicionar seu e-mail." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((row: any) => (
            <Link key={row.peladas.id} href={`/peladas/${row.peladas.id}`}>
              <Card className="h-full transition hover:border-field-500">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{row.peladas.name}</h2>
                    <p className="mt-1 text-sm text-zinc-600">{row.peladas.venue ?? "Local não informado"}</p>
                  </div>
                  <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs uppercase text-zinc-600">{row.role}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-zinc-600">
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

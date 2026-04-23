import { CalendarDays, CircleDollarSign, Shuffle, UsersRound } from "lucide-react";
import { LinkButton, Card } from "@/components/ui";
import { getUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getUser();

  return (
    <div className="grid gap-10 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-field-700">Peladas organizadas sem planilha solta</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Controle presença, sorteio, rodada e caixa da sua pelada.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-600">
          Uma base simples e segura para administrar o jogo da semana, membros, cobranças e pagamentos em desktop ou celular.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton href={user ? "/dashboard" : "/signup"}>{user ? "Abrir painel" : "Começar agora"}</LinkButton>
          <LinkButton href="/login" variant="secondary">Entrar</LinkButton>
        </div>
      </section>
      <section className="grid gap-3 sm:grid-cols-2">
        {[
          ["Agenda", "Crie rodadas e acompanhe presença.", CalendarDays],
          ["Membros", "Gerencie owner, admins e jogadores.", UsersRound],
          ["Sorteio", "Monte times aleatórios entre presentes.", Shuffle],
          ["Financeiro", "Veja cobranças, pagamentos e saldo.", CircleDollarSign]
        ].map(([title, text, Icon]) => (
          <Card key={title as string}>
            <Icon className="text-field-600" />
            <h2 className="mt-4 font-semibold">{title as string}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{text as string}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}

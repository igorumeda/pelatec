import Image from "next/image";
import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  MapPin,
  ShieldCheck,
  Shuffle,
  UsersRound
} from "lucide-react";
import { Card, LinkButton } from "@/components/ui";
import { getUser } from "@/lib/auth";

const heroImage =
  "https://images.pexels.com/photos/11489059/pexels-photo-11489059.jpeg?cs=srgb&dl=pexels-tkirkgoz-11489059.jpg&fm=jpg";
const friendsImage =
  "https://images.pexels.com/photos/5235779/pexels-photo-5235779.jpeg?cs=srgb&dl=pexels-cottonbro-5235779.jpg&fm=jpg";
const teamsImage =
  "https://images.pexels.com/photos/6077792/pexels-photo-6077792.jpeg?cs=srgb&dl=pexels-tima-miroshnichenko-6077792.jpg&fm=jpg";

const features = [
  {
    title: "Agenda",
    text: "Agende as proximas peladas, acompanhe confirmacoes e chegue no dia com a lista resolvida.",
    image: heroImage,
    icon: CalendarDays
  },
  {
    title: "Membros",
    text: "Centralize donos, admins e jogadores em um cadastro simples, sem depender de planilha solta.",
    image: teamsImage,
    icon: UsersRound
  },
  {
    title: "Sorteio",
    text: "Monte os times entre os presentes e ajuste manualmente quando a rodada pedir mudancas rapidas.",
    image: friendsImage,
    icon: Shuffle
  },
  {
    title: "Financeiro",
    text: "Visualize cobrancas, pagamentos, pendencias e despesas da pelada em um unico lugar.",
    image: heroImage,
    icon: CircleDollarSign
  }
];

export default async function HomePage() {
  const user = await getUser();
  const primaryHref = user ? "/dashboard" : "/signup";
  const primaryLabel = user ? "Abrir painel" : "Comecar agora";

  return (
    <div className="space-y-16 py-6 sm:py-8">
      <section className="grid gap-8 lg:grid-cols-[1fr_1.12fr] lg:items-center">
        <div className="order-2 lg:order-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-field-700">Peladas organizadas sem caos no grupo</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Organize a pelada da semana com mais clareza antes, durante e depois do jogo.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-600">
            Presenca, sorteio, rodada e financeiro no mesmo fluxo. Menos improviso no WhatsApp, mais controle para quem organiza e
            mais visibilidade para quem participa.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href={primaryHref}>{primaryLabel}</LinkButton>
            <LinkButton href="/login" variant="secondary">Entrar</LinkButton>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Highlight icon={CheckCircle2} title="Presenca resolvida" text="Confirmados, pendentes e faltas num so lugar." />
            <Highlight icon={Shuffle} title="Sorteio rapido" text="Monte os times no campo em poucos toques." />
            <Highlight icon={ShieldCheck} title="Caixa visivel" text="Cobrancas, despesas e saldo sempre acessiveis." />
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-soft">
            <div className="relative aspect-[5/4]">
              <Image
                src={heroImage}
                alt="Jogadores disputando a bola em uma pelada ao ar livre"
                fill
                className="object-cover"
                priority
                sizes="(min-width: 1024px) 52vw, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            </div>

            <div className="absolute left-4 top-4 right-4 flex flex-wrap gap-2">
              <OverlayPill icon={MapPin} text="Campo, horario e presenca no mesmo painel" />
            </div>

            <div className="absolute bottom-4 left-4 right-4 grid gap-3 sm:grid-cols-2">
              <OverlayCard
                title="Rodada da quinta"
                lines={["12 confirmados", "5 pendentes", "Sorteio pronto para o dia"]}
              />
              <OverlayCard
                title="Financeiro da pelada"
                lines={["3 pendencias abertas", "2 pagamentos aguardando", "Saldo sempre visivel"]}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-field-700">Como funciona</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">Tudo o que a pelada precisa em um fluxo so.</h2>
          <p className="mt-3 text-base leading-7 text-zinc-600">
            A home continua simples, mas o produto ganha cara logo aqui: futebol real, rotina operacional e interface pronta para uso.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="overflow-hidden p-0">
              <div className="relative aspect-[4/3]">
                <Image
                  src={feature.image}
                  alt={feature.title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1280px) 22vw, (min-width: 768px) 45vw, 100vw"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2">
                  <feature.icon size={18} className="text-field-700" />
                  <h3 className="font-semibold text-zinc-900">{feature.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{feature.text}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-field-700">Veja o produto em acao</p>
          <h2 className="text-3xl font-bold tracking-tight text-ink">Um sistema de pelada que parece sistema de verdade.</h2>
          <p className="text-base leading-7 text-zinc-600">
            Em vez de depender de mensagens espalhadas, a organizacao fica concentrada em paineis objetivos para rodada, membros e
            financeiro.
          </p>
          <ul className="space-y-3 text-sm text-zinc-700">
            <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5 text-field-700" /> Painel da pelada com resumo operacional</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5 text-field-700" /> Confirmacao de presenca e sorteio de times</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={16} className="mt-0.5 text-field-700" /> Cobrancas, pagamentos e despesas em um unico fluxo</li>
          </ul>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <MockPanel
            eyebrow="Dashboard"
            title="Resumo da pelada"
            items={[
              "24 membros",
              "Proxima rodada na quinta, 20:00",
              "3 pendencias financeiras"
            ]}
          />
          <MockPanel
            eyebrow="Rodada"
            title="Presenca e sorteio"
            items={[
              "12 confirmados",
              "5 pendentes",
              "Times montados e editaveis"
            ]}
          />
          <MockPanel
            eyebrow="Financeiro"
            title="Controle simples"
            items={[
              "Receitas e despesas por competencia",
              "Pagamentos aguardando aprovacao",
              "Saldo geral atualizado"
            ]}
          />
          <MockImagePanel />
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-soft">
          <div className="relative aspect-[16/10]">
            <Image
              src={friendsImage}
              alt="Grupo de amigos se reunindo para jogar pelada em campo aberto"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/15 to-transparent" />
          </div>
          <div className="absolute inset-y-0 left-0 flex max-w-md items-end p-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-white/85">Mais que agenda</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-white">Menos desencontro antes do jogo. Mais tempo para jogar.</p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-field-700">Valor operacional</p>
          <h2 className="text-3xl font-bold tracking-tight text-ink">Feito para quem organiza a pelada sem querer perder a semana nisso.</h2>
          <div className="grid gap-3">
            <Benefit
              icon={CalendarDays}
              title="Agenda sem friccao"
              text="A proxima rodada fica visivel para todo mundo, com data, horario, local e lista de confirmacao."
            />
            <Benefit
              icon={UsersRound}
              title="Presenca centralizada"
              text="Quem vai, quem nao vai e quem ainda nao respondeu aparecem sem depender de lembrar conversa em grupo."
            />
            <Benefit
              icon={CircleDollarSign}
              title="Financeiro mais claro"
              text="Cobrancas e despesas deixam de ficar escondidas em anotações soltas e passam a ter historico."
            />
            <Benefit
              icon={Shuffle}
              title="Sorteio no momento certo"
              text="No dia da pelada, os times podem ser montados e ajustados com rapidez."
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white px-6 py-8 shadow-soft sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-field-700">Pronto para organizar melhor</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">Monte sua pelada, acompanhe a rodada e deixe o caos fora do campo.</h2>
            <p className="mt-3 text-base leading-7 text-zinc-600">
              Comece pela proxima quinta, pelo grupo atual e pelo que mais pesa hoje: presenca, sorteio e financeiro.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <LinkButton href={primaryHref}>{primaryLabel}</LinkButton>
            <LinkButton href="/login" variant="secondary">Entrar</LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}

function Highlight({
  icon: Icon,
  title,
  text
}: {
  icon: typeof CheckCircle2;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
      <Icon size={18} className="text-field-700" />
      <p className="mt-3 text-sm font-semibold text-zinc-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-zinc-600">{text}</p>
    </div>
  );
}

function OverlayPill({ icon: Icon, text }: { icon: typeof MapPin; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md bg-white/92 px-3 py-2 text-sm font-medium text-zinc-800 shadow-soft">
      <Icon size={16} className="text-field-700" />
      {text}
    </span>
  );
}

function OverlayCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-lg border border-white/40 bg-white/92 p-4 shadow-soft backdrop-blur">
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      <div className="mt-3 space-y-2">
        {lines.map((line) => (
          <div key={line} className="rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

function MockPanel({ eyebrow, title, items }: { eyebrow: string; title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wide text-field-700">{eyebrow}</p>
      <h3 className="mt-2 font-semibold text-zinc-900">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item, index) => (
          <div key={item} className="rounded-md border border-zinc-200 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-zinc-700">{item}</span>
              <span className={`h-2.5 w-2.5 rounded-full ${index === 0 ? "bg-field-600" : index === 1 ? "bg-zinc-300" : "bg-amber-400"}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockImagePanel() {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-soft">
      <div className="relative aspect-[4/3]">
        <Image
          src={teamsImage}
          alt="Times alinhados em um campo de futebol society"
          fill
          className="object-cover"
          sizes="(min-width: 768px) 40vw, 100vw"
        />
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-field-700">Rotina do jogo</p>
        <h3 className="mt-2 font-semibold text-zinc-900">Visual de pelada real, com software por tras.</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          A home mostra o clima do campo, mas o produto continua focado em operacao: rodada, membros e caixa.
        </p>
      </div>
    </div>
  );
}

function Benefit({
  icon: Icon,
  title,
  text
}: {
  icon: typeof CalendarDays;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
      <div className="flex items-center gap-2">
        <Icon size={18} className="text-field-700" />
        <p className="font-semibold text-zinc-900">{title}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{text}</p>
    </div>
  );
}

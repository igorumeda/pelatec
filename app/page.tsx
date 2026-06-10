import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, CheckCircle2, CircleDollarSign, MapPin, Search, Shuffle, UserPlus, UsersRound } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Card, LinkButton } from "@/components/ui";
import { getUser } from "@/lib/auth";

const heroImage =
  "https://images.pexels.com/photos/11489059/pexels-photo-11489059.jpeg?cs=srgb&dl=pexels-tkirkgoz-11489059.jpg&fm=jpg";
const teamImage =
  "https://images.pexels.com/photos/6077792/pexels-photo-6077792.jpeg?cs=srgb&dl=pexels-tima-miroshnichenko-6077792.jpg&fm=jpg";
const celebrationImage =
  "https://images.pexels.com/photos/5235779/pexels-photo-5235779.jpeg?cs=srgb&dl=pexels-cottonbro-5235779.jpg&fm=jpg";

const features = [
  {
    icon: CalendarDays,
    title: "Agenda da pelada",
    text: "Rodadas agendadas com data, hora, local e limite de jogadores já visíveis para o grupo."
  },
  {
    icon: UsersRound,
    title: "Membros e presença",
    text: "Administre administradores, jogadores e confirmações sem depender de conversas espalhadas."
  },
  {
    icon: Shuffle,
    title: "Sorteio no campo",
    text: "Monte os times entre os presentes e ajuste manualmente quando a rodada pedir mais equilíbrio."
  },
  {
    icon: CircleDollarSign,
    title: "Financeiro claro",
    text: "Cobranças, comprovantes, aprovações e despesas no mesmo fluxo operacional."
  }
];

export default async function HomePage() {
  const user = await getUser();
  if (user) redirect("/dashboard");

  const primaryHref = "/signup";
  const primaryLabel = "Começar agora";

  return (
    <div className="space-y-16 pb-10">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-950 via-brand-900 to-brand-950 shadow-panel">
        <div className="grid gap-10 px-6 py-8 lg:grid-cols-[1.02fr_0.98fr] lg:px-10 lg:py-10">
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <BrandLogo variant="icon" className="h-12 w-12" />
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-field-400">Futebol amador mais conectado</p>
                  <p className="text-sm text-slate-200">Organização, comunidade e tecnologia no mesmo jogo.</p>
                </div>
              </div>

              <h1 className="mt-8 max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Organize sua pelada e conecte jogadores ao jogo.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
                O Pelatec foi feito para quem precisa tocar a rodada com clareza: agenda, presença, sorteio, financeiro e conexão
                entre jogadores e peladas num só lugar.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <LinkButton href={primaryHref} className="bg-field-500 hover:bg-field-600">
                  {primaryLabel}
                  <ArrowRight size={16} />
                </LinkButton>
                <LinkButton
                  href="/login"
                  variant="secondary"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                >
                  Entrar
                </LinkButton>
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <MetricCard value="12" label="confirmados na próxima" color="field" />
              <MetricCard value="3" label="pagamentos aguardando" color="accent" />
              <MetricCard value="24" label="membros organizados" color="field" />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-brand-900">
            <div className="relative aspect-[4/4.2] lg:aspect-[5/5.3]">
              <Image
                src={heroImage}
                alt="Jogadores celebrando uma jogada em uma pelada"
                fill
                priority
                sizes="(min-width: 1024px) 44vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-950/45 to-transparent" />
            </div>

            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              <Pill icon={MapPin} text="Society, futsal e campo" />
              <Pill icon={Search} text="Peladas e jogadores conectados" />
            </div>

            <div className="absolute inset-x-4 bottom-4 grid gap-3 sm:grid-cols-2">
              <GlassCard
                title="Rodada de quinta"
                items={["20:00 no campo principal", "12 confirmados e 5 pendentes", "Sorteio pronto para o dia"]}
              />
              <GlassCard
                title="Painel financeiro"
                items={["R$ 320,00 em receitas do mês", "2 aprovações pendentes", "3 cobranças ainda em aberto"]}
              />
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="space-y-6">
        <div className="max-w-3xl">
          <p className="section-kicker">Como funciona</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Um fluxo simples para quem organiza e para quem só quer chegar e jogar.
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-600">
            A identidade do Pelatec puxa para esporte e comunidade, mas a base continua prática: menos improviso, mais operação.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature, index) => (
            <Card key={feature.title} className="overflow-hidden p-0">
              <div className="relative aspect-[4/3]">
                <Image
                  src={index % 2 === 0 ? teamImage : celebrationImage}
                  alt={feature.title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1280px) 22vw, (min-width: 768px) 45vw, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-950/70 via-brand-950/15 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/92 text-field-700 shadow-soft">
                    <feature.icon size={20} />
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-brand-950">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.94fr_1.06fr] lg:items-center">
        <div className="surface-dark p-7">
          <p className="section-kicker">Produto de verdade</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Operação concentrada em um painel que ajuda no dia a dia.</h2>
          <p className="mt-4 text-sm leading-7 text-slate-200">
            O Pelatec não é só uma landing bonita. A proposta é mostrar logo na home que existe um software por trás, com rotina de
            rodada, controle de membros e visão financeira.
          </p>

          <div className="mt-6 space-y-4">
            <ChecklistItem text="Painel da pelada com contexto operacional" />
            <ChecklistItem text="Rodada com presença, presentes e sorteio de times" />
            <ChecklistItem text="Cobranças, comprovantes e aprovações no mesmo lugar" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <MockPanel
            eyebrow="Dashboard"
            title="Visão rápida da semana"
            accent="field"
            items={["24 membros ativos", "Próxima rodada às 20:00", "Pendências e saldo no topo"]}
          />
          <MockPanel
            eyebrow="Presença"
            title="Rodada mais controlada"
            accent="accent"
            items={["Confirmados e pendentes por jogador", "Admin pode ajustar presença", "Lista clara para o dia do jogo"]}
          />
          <MockPanel
            eyebrow="Sorteio"
            title="Times montados no momento certo"
            accent="field"
            items={["Sorteio com os presentes", "Trocas manuais entre os times", "Registro simples da rodada"]}
          />
          <MockPanel
            eyebrow="Financeiro"
            title="Receitas, despesas e aprovações"
            accent="accent"
            items={["Cobrança em lote por competência", "Comprovantes com revisão", "Relatório agrupado por mês"]}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-soft">
          <div className="relative aspect-[16/10]">
            <Image
              src={celebrationImage}
              alt="Jogadores de futebol amador reunidos antes da partida"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 48vw, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-950/75 via-brand-950/20 to-transparent" />
          </div>
          <div className="absolute inset-y-0 left-0 flex max-w-lg items-end p-6">
            <div>
              <p className="section-kicker text-field-100">Conexão e comunidade</p>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-white">A ponte entre quem organiza e quem quer jogar.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="section-kicker">Valor operacional</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Menos caos no grupo. Mais clareza para organizar a próxima bola.
          </h2>
          <Benefit icon={UserPlus} title="Conecte jogadores ao jogo" text="O produto já nasce com cara de plataforma, não só de agenda de presença." />
          <Benefit icon={CalendarDays} title="Organização visível" text="Data, horário, local e presença deixam de depender de memória ou conversa fixada." />
          <Benefit icon={CircleDollarSign} title="Financeiro acessível" text="Quem pagou, quem está devendo e o que foi gasto aparecem sem planilha paralela." />
          <Benefit icon={Shuffle} title="Sorteio mais rápido" text="No dia da rodada, os times ficam prontos em poucos toques, com ajuste manual quando precisar." />
        </div>
      </section>

      <section className="surface-panel px-6 py-8 sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="section-kicker-dark">Pronto para jogar melhor organizado</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-950">
              A pelada mais organizada começa com presença, sorteio e caixa no mesmo lugar.
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Monte sua base, acompanhe a próxima rodada e dê visibilidade para tudo o que costuma se perder no caminho.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <LinkButton href={primaryHref}>
              {primaryLabel}
              <ArrowRight size={16} />
            </LinkButton>
            <LinkButton href="/login" variant="secondary">Entrar</LinkButton>
          </div>
        </div>
      </section>

      <footer className="overflow-hidden rounded-[2rem] border border-brand-700/70 bg-brand-950 text-white shadow-panel">
        <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] lg:px-8">
          <div>
            <BrandLogo variant="full" theme="dark" className="h-12" />
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-300">
              Plataforma para organizar peladas, conectar jogadores ao jogo e dar mais clareza para quem toca a rodada toda semana.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-field-300">Produto</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <a href="#como-funciona" className="block hover:text-white">Como funciona</a>
              <Link href={primaryHref} className="block hover:text-white">{primaryLabel}</Link>
              <Link href="/login" className="block hover:text-white">Entrar</Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-field-300">Operação</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <span className="block">Agenda da pelada</span>
              <span className="block">Confirmação de presença</span>
              <span className="block">Financeiro simples</span>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-field-300">Marca</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <span className="block">Futebol amador</span>
              <span className="block">Conexão</span>
              <span className="block">Comunidade e tecnologia</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 px-6 py-4 text-sm text-slate-400 lg:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 Pelatec. Todos os direitos reservados.</span>
            <span>Organize, conecte e jogue.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function MetricCard({ value, label, color }: { value: string; label: string; color: "field" | "accent" }) {
  return (
    <div className="rounded-3xl border border-white/15 bg-white/12 px-4 py-4 backdrop-blur-sm">
      <p className={color === "field" ? "text-3xl font-extrabold text-field-400" : "text-3xl font-extrabold text-accent-300"}>{value}</p>
      <p className="mt-1 text-sm text-slate-100">{label}</p>
    </div>
  );
}

function Pill({ icon: Icon, text }: { icon: typeof MapPin; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm">
      <Icon size={14} className="text-field-200" />
      {text}
    </span>
  );
}

function GlassCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[1.4rem] border border-white/15 bg-white/12 p-4 text-white shadow-soft backdrop-blur-md">
      <p className="font-semibold">{title}</p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-xl bg-white/15 px-3 py-2 text-sm text-white">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function MockPanel({
  eyebrow,
  title,
  items,
  accent
}: {
  eyebrow: string;
  title: string;
  items: string[];
  accent: "field" | "accent";
}) {
  const accentClass = accent === "field" ? "bg-field-100 text-field-700" : "bg-accent-100 text-amber-700";

  return (
    <Card>
      <span className={["inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide", accentClass].join(" ")}>{eyebrow}</span>
      <h3 className="mt-3 text-lg font-bold text-brand-950">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item, index) => (
          <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50/90 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-700">{item}</span>
              <span className={index % 2 === 0 ? "h-2.5 w-2.5 rounded-full bg-field-500" : "h-2.5 w-2.5 rounded-full bg-accent-400"} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-field-300" />
      <p className="text-sm text-slate-100">{text}</p>
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
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-field-50 text-field-700">
          <Icon size={19} />
        </span>
        <div>
          <p className="font-semibold text-brand-950">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
        </div>
      </div>
    </Card>
  );
}

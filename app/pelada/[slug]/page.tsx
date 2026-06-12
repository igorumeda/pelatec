import Image from "next/image";
import { notFound } from "next/navigation";
import { CalendarDays, LayoutDashboard, MapPin, Shield, Sparkles, Users, WalletCards } from "lucide-react";
import { Card, CardTitle, LinkButton } from "@/components/ui";
import { brl } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

const defaultCrest = "/default-pelada-crest.svg";
const defaultBanner = "/default-pelada-banner.svg";

type PublicPelada = {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  neighborhood: string | null;
  venue: string | null;
  venue_address: string | null;
  venue_place_id: string | null;
  venue_lat: number | string | null;
  venue_lng: number | string | null;
  preferred_weekdays: string | null;
  default_time: string | null;
  monthly_fee: number | string | null;
  daily_fee: number | string | null;
  status: "active" | "inactive";
  crest_url: string | null;
  banner_url: string | null;
  public_slug: string;
  created_at: string;
  members_count: number | string;
  rounds_count: number | string;
  scheduled_rounds_count: number | string;
  finished_rounds_count: number | string;
  average_player_quality: number | string | null;
};

export default async function PublicPeladaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_pelada_by_slug", {
    target_slug: slug
  });

  if (error) throw new Error(error.message);

  const pelada = (data?.[0] ?? null) as PublicPelada | null;
  if (!pelada) notFound();

  const bannerSrc = pelada.banner_url || defaultBanner;
  const crestSrc = pelada.crest_url || defaultCrest;
  const location = [pelada.venue_address ?? pelada.venue, pelada.neighborhood, pelada.city].filter(Boolean).join(" - ");
  const averageQuality = Number(pelada.average_player_quality ?? 0);
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: membership } = user
    ? await supabase
      .from("pelada_members")
      .select("role")
      .eq("pelada_id", pelada.id)
      .eq("user_id", user.id)
      .maybeSingle()
    : { data: null };
  const canOpenPanel = membership?.role === "owner" || membership?.role === "admin";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="relative overflow-hidden rounded-[36px] border border-cyan-300/15 bg-brand-950 shadow-2xl">
        <div className="relative min-h-[360px]">
          <Image
            src={bannerSrc}
            alt={`Banner da pelada ${pelada.name}`}
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1152px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/55 to-brand-950/10" />
          {canOpenPanel ? (
            <div className="absolute right-5 top-5 z-10">
              <LinkButton href={`/peladas/${pelada.id}`} className="bg-white text-brand-950 hover:bg-slate-100">
                <LayoutDashboard size={18} />
                Acessar painel
              </LinkButton>
            </div>
          ) : null}
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
              <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-white/25 bg-white shadow-2xl">
                <Image
                  src={crestSrc}
                  alt={`Brasão da pelada ${pelada.name}`}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">{pelada.name}</h1>
                {pelada.description ? (
                  <p className="mt-3 max-w-3xl text-base leading-7 text-slate-100">{pelada.description}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Users} label="Jogadores" value={pelada.members_count} />
        <MetricCard icon={CalendarDays} label="Rodadas" value={pelada.rounds_count} />
        <MetricCard icon={Sparkles} label="Qualidade media" value={`${averageQuality.toFixed(1)}/10`} />
        <MetricCard icon={Shield} label="Rodadas realizadas" value={pelada.finished_rounds_count} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardTitle icon={MapPin}>Detalhes da pelada</CardTitle>
          <div className="mt-5 divide-y divide-panel-200">
            <DetailRow label="Local" value={location || "Não informado"} />
            <DetailRow label="Dias preferenciais" value={pelada.preferred_weekdays || "Não informado"} />
            <DetailRow label="Horário padrao" value={pelada.default_time ? pelada.default_time.slice(0, 5) : "Não informado"} />
            <DetailRow label="Rodadas agendadas" value={String(pelada.scheduled_rounds_count)} />
            <DetailRow label="Rodadas realizadas" value={String(pelada.finished_rounds_count)} />
          </div>
        </Card>

        <Card>
          <CardTitle icon={WalletCards}>Valores e participacao</CardTitle>
          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-panel-200 bg-panel-50/85 p-4">
              <p className="text-sm font-medium text-slate-600">Mensalista</p>
              <p className="mt-2 text-3xl font-extrabold text-brand-950">{brl(pelada.monthly_fee)}</p>
            </div>
            <div className="rounded-2xl border border-panel-200 bg-panel-50/85 p-4">
              <p className="text-sm font-medium text-slate-600">Diarista</p>
              <p className="mt-2 text-3xl font-extrabold text-brand-950">{brl(pelada.daily_fee)}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="surface-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-700/10 text-brand-900">
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-extrabold text-brand-950">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="text-right text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

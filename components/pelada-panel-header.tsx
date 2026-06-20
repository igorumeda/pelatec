import Link from "next/link";
import { CalendarDays, CircleDollarSign, Clock3, LayoutDashboard, MapPin, UsersRound } from "lucide-react";
import { PeladaQuickActionsMenu } from "@/components/pelada-quick-actions-menu";
import { PageHeader } from "@/components/ui";
import { cn, peladaStatusLabel } from "@/lib/utils";

type PeladaPanelHeaderProps = {
  pelada: {
    id: string;
    name: string;
    description?: string | null;
    venue?: string | null;
    venue_address?: string | null;
    default_time?: string | null;
    status?: string | null;
    is_public?: boolean | null;
    public_slug?: string | null;
  } | null;
  manageable: boolean;
  active: "painel" | "rodadas" | "membros" | "financeiro";
};

export function PeladaPanelHeader({ pelada, manageable, active }: PeladaPanelHeaderProps) {
  const peladaId = pelada?.id ?? "";
  const publicHref = pelada?.is_public && pelada.public_slug ? `/pelada/${pelada.public_slug}` : null;
  const venueLabel = pelada?.venue_address ?? pelada?.venue ?? null;
  const topMeta = [
    venueLabel ? { icon: MapPin, label: venueLabel } : null,
    pelada?.default_time ? { icon: Clock3, label: `Horário padrão ${pelada.default_time.slice(0, 5)}` } : null,
    pelada?.status ? { icon: CircleDollarSign, label: `Status ${peladaStatusLabel(pelada.status)}` } : null
  ].filter(Boolean) as { icon: typeof MapPin; label: string }[];

  return (
    <div className="space-y-4">
      <section className="surface-dark px-6 py-7 sm:px-8">
        <PageHeader
          title={pelada?.name ?? "Pelada"}
          description={pelada?.description ?? "Painel operacional da pelada."}
          theme="dark"
          action={peladaId ? <PeladaQuickActionsMenu peladaId={peladaId} manageable={manageable} publicHref={publicHref} /> : null}
        />

        {topMeta.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {topMeta.map((item) => (
              <span key={item.label} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/12 px-3 py-2 text-sm text-white">
                <item.icon size={16} className="text-field-200" />
                {item.label}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      {peladaId ? (
        <nav className="flex gap-2 overflow-x-auto rounded-3xl border border-brand-700/45 bg-brand-950/55 p-2 shadow-soft" aria-label="Menu da pelada">
          <PeladaNavLink href={`/peladas/${peladaId}`} icon={LayoutDashboard} label="Painel" active={active === "painel"} />
          <PeladaNavLink href={`/peladas/${peladaId}/rodadas`} icon={CalendarDays} label="Rodadas" active={active === "rodadas"} />
          <PeladaNavLink href={`/peladas/${peladaId}/membros`} icon={UsersRound} label="Membros" active={active === "membros"} />
          {manageable ? (
            <PeladaNavLink href={`/peladas/${peladaId}/financeiro`} icon={CircleDollarSign} label="Financeiro" active={active === "financeiro"} />
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}

function PeladaNavLink({
  href,
  icon: Icon,
  label,
  active
}: {
  href: string;
  icon: typeof CalendarDays;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition",
        active ? "bg-white/14 text-white shadow-sm" : "text-slate-100 hover:bg-white/10 hover:text-white"
      )}
    >
      <Icon size={17} className={active ? "text-field-200" : "text-slate-300"} />
      {label}
    </Link>
  );
}

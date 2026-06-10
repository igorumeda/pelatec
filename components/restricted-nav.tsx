"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, LayoutDashboard, ShieldCheck, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";

type RestrictedNavProps = {
  profileHref: string;
};

const links = [
  {
    href: "/dashboard",
    label: "Painel",
    icon: LayoutDashboard,
    matches: (pathname: string) => pathname === "/dashboard"
  },
  {
    href: "/peladas",
    label: "Minhas Peladas",
    icon: UsersRound,
    matches: (pathname: string) => pathname === "/peladas" || pathname.startsWith("/peladas/")
  },
  {
    href: "/explorar",
    label: "Explorar",
    icon: Compass,
    matches: (pathname: string) => pathname === "/explorar"
  }
];

export function RestrictedNav({ profileHref }: RestrictedNavProps) {
  const pathname = usePathname();
  const profileActive = pathname === profileHref || pathname === "/perfil";

  return (
    <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto pt-3 md:order-none md:w-auto md:pt-0" aria-label="Menu principal">
      {links.map((item) => {
        const active = item.matches(pathname);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-200 hover:bg-white/10 hover:text-white",
              active && "bg-white/12 text-white ring-1 ring-white/15"
            )}
          >
            <Icon size={16} />
            {item.label}
          </Link>
        );
      })}

      <Link
        href={profileHref}
        className={cn(
          "inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-200 hover:bg-white/10 hover:text-white",
          profileActive && "bg-white/12 text-white ring-1 ring-white/15"
        )}
      >
        <ShieldCheck size={16} />
        Meu Perfil
      </Link>
    </nav>
  );
}

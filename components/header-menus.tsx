"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, LayoutDashboard, LogOut, UserRound, Users } from "lucide-react";
import { signOutAction } from "@/app/actions";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  created_at: string;
  kind: "financeira" | "aprovacao";
};

type UserMenuProps = {
  profile: {
    name: string;
    email: string;
    avatar_url?: string | null;
  };
};

export function NotificationsMenu({ items }: { items: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const count = items.length;
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="relative rounded-md p-2 hover:bg-zinc-100"
        aria-label="Notificações"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={18} />
        {count ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-30 w-[360px] rounded-lg border border-zinc-200 bg-white p-2 shadow-soft">
          <div className="px-3 py-2">
            <p className="font-semibold">Notificações</p>
            <p className="text-xs text-zinc-500">Financeiras e aprovações, da mais recente para a mais antiga.</p>
          </div>
          <div className="max-h-[420px] space-y-1 overflow-auto">
            {items.length ? (
              items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-3 hover:bg-zinc-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="mt-1 text-sm text-zinc-600">{item.description}</p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold uppercase",
                        item.kind === "financeira" && "bg-field-100 text-field-700",
                        item.kind === "aprovacao" && "bg-sky-100 text-sky-700"
                      )}
                    >
                      {item.kind}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">{new Date(item.created_at).toLocaleString("pt-BR")}</p>
                </Link>
              ))
            ) : (
              <div className="px-3 py-6 text-sm text-zinc-500">Nenhuma notificação por enquanto.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function UserMenu({ profile }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const initials = useMemo(() => {
    const parts = profile.name.trim().split(/\s+/).slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "U";
  }, [profile.name]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="rounded-md p-2 hover:bg-zinc-100"
        aria-label="Menu do usuário"
        onClick={() => setOpen((value) => !value)}
      >
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt={profile.name} className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <UserRound size={20} />
        )}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-30 w-72 rounded-lg border border-zinc-200 bg-white p-2 shadow-soft">
          <div className="rounded-md bg-zinc-50 p-3">
            <div className="flex items-center gap-3">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={profile.name} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-field-100 text-sm font-bold text-field-700">
                  {initials}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{profile.name}</p>
                <p className="truncate text-xs text-zinc-500">{profile.email}</p>
              </div>
            </div>
          </div>

          <div className="mt-2 space-y-1">
            <MenuLink href="/dashboard" icon={<LayoutDashboard size={16} />} label="Painel" onClick={() => setOpen(false)} />
            <MenuLink href="/peladas" icon={<Users size={16} />} label="Peladas" onClick={() => setOpen(false)} />
            <MenuLink href="/perfil" icon={<UserRound size={16} />} label="Perfil" onClick={() => setOpen(false)} />
          </div>

          <form action={signOutAction} className="mt-2 border-t border-zinc-200 pt-2">
            <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
              <LogOut size={16} />
              Sair
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
  onClick
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-zinc-50">
      {icon}
      {label}
    </Link>
  );
}

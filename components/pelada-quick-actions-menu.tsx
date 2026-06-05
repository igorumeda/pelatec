"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  CalendarPlus2,
  CircleDollarSign,
  ExternalLink,
  MoreHorizontal,
  ReceiptText,
  Settings,
  UserPlus,
  UsersRound,
  Wallet
} from "lucide-react";

type PeladaQuickActionsMenuProps = {
  peladaId: string;
  manageable: boolean;
  publicHref?: string | null;
};

export function PeladaQuickActionsMenu({ peladaId, manageable, publicHref }: PeladaQuickActionsMenuProps) {
  const [open, setOpen] = useState(false);
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

  const items = [
    manageable ? { href: `/peladas/${peladaId}/rodadas`, label: "Agendar rodada", icon: CalendarPlus2 } : null,
    manageable ? { href: `/peladas/${peladaId}/membros`, label: "Adicionar membro", icon: UserPlus } : null,
    manageable ? { href: `/peladas/${peladaId}/financeiro`, label: "Lançar pagamento", icon: CircleDollarSign } : null,
    manageable ? { href: `/peladas/${peladaId}/financeiro`, label: "Registrar despesa", icon: Wallet } : null,
    { href: `/peladas/${peladaId}/rodadas`, label: "Ver agenda", icon: CalendarDays },
    { href: `/peladas/${peladaId}/membros`, label: "Ver membros", icon: UsersRound },
    publicHref ? { href: publicHref, label: "Ver página pública", icon: ExternalLink } : null,
    manageable ? { href: `/peladas/${peladaId}/financeiro`, label: "Ver financeiro", icon: ReceiptText } : null,
    manageable ? { href: `/peladas/${peladaId}/editar`, label: "Editar dados", icon: Settings } : null
  ].filter(Boolean) as Array<{ href: string; label: string; icon: typeof CalendarDays }>;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Ações rápidas"
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/15"
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal size={18} />
      </button>

      {open ? (
        <div className="absolute right-0 top-14 z-30 w-64 overflow-hidden rounded-3xl border border-slate-200 bg-panel-50 shadow-panel">
          <div className="border-b border-slate-200 bg-panel-100/80 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Ações rápidas</p>
          </div>
          <div className="space-y-1 p-2">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-panel-100"
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

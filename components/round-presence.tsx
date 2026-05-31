"use client";

import { createContext, useCallback, useContext, useMemo, useState, useTransition } from "react";
import { Check, Clock, MoreVertical, X } from "lucide-react";
import { updatePresenceAction } from "@/app/actions";
import { DrawBoard } from "@/components/draw-board";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

type PresenceStatus = "confirmed" | "declined" | "pending";
type Member = {
  user_id: string;
  name: string;
  email?: string | null;
  status: PresenceStatus;
};

type PresenceContextValue = {
  roundId: string;
  currentUserId: string;
  members: Member[];
  markPresence: (userId: string, status: PresenceStatus) => void;
  pendingKey: string;
  message: string;
};

const PresenceContext = createContext<PresenceContextValue | null>(null);

const labels: Record<PresenceStatus, string> = {
  confirmed: "Confirmado",
  declined: "Recusado",
  pending: "Pendente"
};

const icons = {
  confirmed: Check,
  declined: X,
  pending: Clock
};

export function RoundPresenceProvider({
  roundId,
  currentUserId,
  initialMembers,
  children
}: {
  roundId: string;
  currentUserId: string;
  initialMembers: Member[];
  children: React.ReactNode;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [message, setMessage] = useState("");
  const [pendingKey, setPendingKey] = useState("");
  const [, startTransition] = useTransition();

  const markPresence = useCallback((userId: string, status: PresenceStatus) => {
    const previous = members;
    setPendingKey(`${userId}:${status}`);
    setMessage("");
    setMembers((current) => current.map((member) => (member.user_id === userId ? { ...member, status } : member)));

    startTransition(async () => {
      const formData = new FormData();
      formData.set("round_id", roundId);
      formData.set("user_id", userId);
      formData.set("status", status);
      const response = await updatePresenceAction(null, formData);
      if (!response.ok) {
        setMembers(previous);
      }
      setMessage(response.message);
      setPendingKey("");
    });
  }, [members, roundId]);

  const value = useMemo(
    () => ({ roundId, currentUserId, members, markPresence, pendingKey, message }),
    [currentUserId, markPresence, members, message, pendingKey, roundId]
  );

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export function MyPresenceCard() {
  const context = usePresenceContext();
  const me = context.members.find((member) => member.user_id === context.currentUserId);
  const currentStatus = me?.status ?? "pending";

  return (
    <Card>
      <h2 className="font-semibold text-slate-900">Minha presenca</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(labels) as PresenceStatus[]).map((status) => {
          const Icon = icons[status];
          const active = currentStatus === status;
          return (
            <button
              key={status}
              type="button"
              className={cn(
                "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition",
                active ? "border-field-600 bg-field-600 text-white" : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
              )}
              onClick={() => context.markPresence(context.currentUserId, status)}
              disabled={context.pendingKey === `${context.currentUserId}:${status}`}
            >
              <Icon size={16} />
              {labels[status]}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-700">Status atual:</span>
        <StatusBadge status={currentStatus} />
        {context.message ? <span className="font-medium text-slate-700">{context.message}</span> : null}
      </div>
    </Card>
  );
}

export function PresenceListCard({ canManage }: { canManage: boolean }) {
  const context = usePresenceContext();

  return (
    <Card>
      <h2 className="font-semibold text-slate-900">Presencas</h2>
      <div className="mt-4 space-y-3">
        {context.members.map((member) => (
          <PresenceRow key={member.user_id} member={member} canManage={canManage} />
        ))}
        {!context.members.length ? <p className="text-sm text-slate-600">Nenhum membro cadastrado na pelada.</p> : null}
      </div>
    </Card>
  );
}

export function PresenceAwareDrawBoard({ roundId }: { roundId: string }) {
  const context = usePresenceContext();
  const confirmedPlayers = context.members
    .filter((member) => member.status === "confirmed")
    .map((member) => ({ id: member.user_id, name: member.name }));

  return <DrawBoard roundId={roundId} players={confirmedPlayers} />;
}

function PresenceRow({ member, canManage }: { member: Member; canManage: boolean }) {
  const context = usePresenceContext();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{member.name}</p>
          {member.email ? <p className="truncate text-xs text-slate-500">{member.email}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={member.status} />
          {canManage ? (
            <button
              type="button"
              aria-label="Alterar presença"
              className="rounded-xl border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50"
              onClick={() => setOpen((value) => !value)}
            >
              <MoreVertical size={16} />
            </button>
          ) : null}
        </div>
      </div>
      {open ? (
        <div className="absolute right-3 top-12 z-10 grid w-44 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-soft">
          {(Object.keys(labels) as PresenceStatus[]).map((status) => {
            const Icon = icons[status];
            return (
              <button
                key={status}
                type="button"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                onClick={() => {
                  setOpen(false);
                  context.markPresence(member.user_id, status);
                }}
              >
                <Icon size={15} />
                {labels[status]}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: PresenceStatus }) {
  const Icon = icons[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold uppercase",
        status === "confirmed" && "bg-field-100 text-field-700",
        status === "declined" && "bg-red-50 text-red-700",
        status === "pending" && "bg-slate-100 text-slate-700"
      )}
    >
      <Icon size={13} />
      {labels[status]}
    </span>
  );
}

function usePresenceContext() {
  const context = useContext(PresenceContext);
  if (!context) throw new Error("Presence components must be used inside RoundPresenceProvider");
  return context;
}

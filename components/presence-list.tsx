"use client";

import { useActionState, useMemo, useState } from "react";
import { Check, Clock, MoreVertical, X } from "lucide-react";
import { updatePresenceAction } from "@/app/actions";
import { cn } from "@/lib/utils";

type PresenceStatus = "confirmed" | "declined" | "pending";
type PresenceMember = {
  user_id: string;
  name: string;
  email?: string | null;
  status: PresenceStatus;
};
type State = { ok?: boolean; message?: string; status?: PresenceStatus; user_id?: string } | null | undefined;

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

export function PresenceList({
  roundId,
  members,
  canManage
}: {
  roundId: string;
  members: PresenceMember[];
  canManage: boolean;
}) {
  const [state, formAction] = useActionState<State, FormData>(updatePresenceAction, null);
  const currentMembers = useMemo(
    () =>
      members.map((member) =>
        state?.ok && state.user_id === member.user_id && state.status
          ? { ...member, status: state.status }
          : member
      ),
    [members, state]
  );

  if (!currentMembers.length) {
    return <p className="text-sm text-slate-600">Nenhum membro cadastrado na pelada.</p>;
  }

  return (
    <div className="space-y-3">
      {currentMembers.map((member) => (
        <PresenceMemberRow
          key={member.user_id}
          roundId={roundId}
          member={member}
          canManage={canManage}
          action={formAction}
        />
      ))}
    </div>
  );
}

function PresenceMemberRow({
  roundId,
  member,
  canManage,
  action
}: {
  roundId: string;
  member: PresenceMember;
  canManage: boolean;
  action: (formData: FormData) => void;
}) {
  const [open, setOpen] = useState(false);
  const Icon = icons[member.status];

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{member.name}</p>
          {member.email ? <p className="truncate text-xs text-slate-500">{member.email}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold uppercase",
              member.status === "confirmed" && "bg-field-100 text-field-700",
              member.status === "declined" && "bg-red-50 text-red-700",
              member.status === "pending" && "bg-slate-100 text-slate-700"
            )}
          >
            <Icon size={13} />
            {labels[member.status]}
          </span>
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
            const ActionIcon = icons[status];
            return (
              <form key={status} action={action}>
                <input type="hidden" name="round_id" value={roundId} />
                <input type="hidden" name="user_id" value={member.user_id} />
                <input type="hidden" name="status" value={status} />
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                  onClick={() => setOpen(false)}
                >
                  <ActionIcon size={15} />
                  {labels[status]}
                </button>
              </form>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

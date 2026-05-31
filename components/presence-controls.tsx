"use client";

import { useActionState, useMemo } from "react";
import { Check, Clock, X } from "lucide-react";
import { updatePresenceAction } from "@/app/actions";
import { cn } from "@/lib/utils";

type PresenceStatus = "confirmed" | "declined" | "pending";
type PresenceState = { ok?: boolean; message?: string; status?: PresenceStatus } | null | undefined;

const labels: Record<PresenceStatus, string> = {
  confirmed: "Confirmado",
  declined: "Recusado",
  pending: "Pendente"
};

export function PresenceControls({
  roundId,
  userId,
  initialStatus
}: {
  roundId: string;
  userId: string;
  initialStatus: PresenceStatus;
}) {
  const [state, formAction] = useActionState<PresenceState, FormData>(updatePresenceAction, null);
  const currentStatus = useMemo(() => state?.status ?? initialStatus, [initialStatus, state?.status]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <PresenceButton action={formAction} roundId={roundId} userId={userId} status="confirmed" currentStatus={currentStatus} icon={<Check size={16} />} />
        <PresenceButton action={formAction} roundId={roundId} userId={userId} status="declined" currentStatus={currentStatus} icon={<X size={16} />} />
        <PresenceButton action={formAction} roundId={roundId} userId={userId} status="pending" currentStatus={currentStatus} icon={<Clock size={16} />} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-700">Status atual:</span>
        <span
          className={cn(
            "rounded-xl px-2.5 py-1 font-semibold",
            currentStatus === "confirmed" && "bg-field-100 text-field-700",
            currentStatus === "declined" && "bg-red-50 text-red-700",
            currentStatus === "pending" && "bg-slate-100 text-slate-700"
          )}
        >
          {labels[currentStatus]}
        </span>
        {state?.message ? <span className={state.ok ? "font-medium text-field-700" : "font-medium text-red-700"}>{state.message}</span> : null}
      </div>
    </div>
  );
}

function PresenceButton({
  action,
  roundId,
  userId,
  status,
  currentStatus,
  icon
}: {
  action: (formData: FormData) => void;
  roundId: string;
  userId: string;
  status: PresenceStatus;
  currentStatus: PresenceStatus;
  icon: React.ReactNode;
}) {
  const active = status === currentStatus;

  return (
    <form action={action}>
      <input type="hidden" name="round_id" value={roundId} />
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className={cn(
          "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition",
          active ? "border-field-600 bg-field-600 text-white" : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
        )}
      >
        {icon}
        {labels[status]}
      </button>
    </form>
  );
}

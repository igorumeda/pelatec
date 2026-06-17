"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteScheduledRoundsAction } from "@/app/actions";
import { Button, EmptyState } from "@/components/ui";
import { cn, dateLabel, roundStatusLabel } from "@/lib/utils";

export type ManagedRound = {
  id: string;
  title: string | null;
  round_date: string;
  starts_at: string;
  duration_minutes: number | string | null;
  status: string;
  operationalStatus: string;
  confirmedCount: number;
  matchCount: number;
};

export function RoundsListManager({
  peladaId,
  rounds,
  canManage
}: {
  peladaId: string;
  rounds: ManagedRound[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const scheduledRounds = useMemo(() => rounds.filter((round) => round.operationalStatus === "scheduled"), [rounds]);
  const selectedRounds = useMemo(() => rounds.filter((round) => selected.includes(round.id)), [rounds, selected]);
  const allScheduledSelected = scheduledRounds.length > 0 && selected.length === scheduledRounds.length;

  function toggleRound(roundId: string) {
    setSelected((current) => current.includes(roundId) ? current.filter((id) => id !== roundId) : [...current, roundId]);
  }

  function toggleAllScheduled() {
    setSelected(allScheduledSelected ? [] : scheduledRounds.map((round) => round.id));
  }

  function removeSelected() {
    if (!selectedRounds.length) return;

    const hasActivity = selectedRounds.some((round) => round.confirmedCount > 0 || round.matchCount > 0);
    if (hasActivity) {
      const confirmed = window.confirm(
        "Uma ou mais rodadas selecionadas possuem jogadores confirmados ou partidas registradas. Deseja realmente remover essas rodadas?"
      );
      if (!confirmed) return;
    }

    const formData = new FormData();
    formData.set("pelada_id", peladaId);
    selectedRounds.forEach((round) => formData.append("round_ids", round.id));

    startTransition(async () => {
      const response = await deleteScheduledRoundsAction(formData);
      setMessage(response?.message ?? "");
      if (response?.ok) {
        setSelected([]);
        router.refresh();
      }
    });
  }

  if (!rounds.length) return <EmptyState title="Nenhuma rodada criada" />;

  return (
    <div className="mt-4 space-y-3">
      {canManage ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-panel-200 bg-panel-50/75 p-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={allScheduledSelected}
              onChange={toggleAllScheduled}
              disabled={!scheduledRounds.length || isPending}
            />
            Selecionar rodadas agendadas
          </label>
          <Button type="button" variant="danger" onClick={removeSelected} disabled={!selected.length || isPending}>
            <Trash2 size={16} />
            Remover selecionadas
          </Button>
        </div>
      ) : null}

      {message ? <p className={cn("text-sm font-medium", message.includes("removida") ? "text-field-700" : "text-red-500")}>{message}</p> : null}

      {rounds.map((round) => {
        const selectable = canManage && round.operationalStatus === "scheduled";
        const hasActivity = round.confirmedCount > 0 || round.matchCount > 0;

        return (
          <div key={round.id} className="flex gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-slate-50">
            {canManage ? (
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0"
                checked={selected.includes(round.id)}
                onChange={() => toggleRound(round.id)}
                disabled={!selectable || isPending}
                title={selectable ? "Selecionar rodada" : "Apenas rodadas agendadas podem ser removidas"}
              />
            ) : null}
            <Link href={`/rodadas/${round.id}`} className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-900">{round.title ?? "Rodada"}</p>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase text-slate-700">
                  {roundStatusLabel(round.operationalStatus)}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {dateLabel(round.round_date)} às {round.starts_at.slice(0, 5)} • {Number(round.duration_minutes ?? 120)} min
              </p>
              {hasActivity ? (
                <p className="mt-2 text-xs font-medium text-amber-300">
                  {round.confirmedCount} confirmado(s) • {round.matchCount} partida(s)
                </p>
              ) : null}
            </Link>
          </div>
        );
      })}
    </div>
  );
}

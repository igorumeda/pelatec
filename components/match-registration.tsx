"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Goal, ShieldAlert } from "lucide-react";
import { createRoundMatchWithStatsAction } from "@/app/actions";
import { Button, Field } from "@/components/ui";

type TeamPlayer = {
  user_id: string;
  profiles?: { name?: string | null } | null;
};

type Team = {
  id: string;
  name: string;
  round_team_players?: TeamPlayer[];
};

export function MatchRegistration({ roundId, teams }: { roundId: string; teams: Team[] }) {
  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [notes, setNotes] = useState("");
  const [goals, setGoals] = useState<Record<string, { goals_for: number; own_goals: number }>>({});
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const teamA = useMemo(() => teams.find((team) => team.id === teamAId), [teamAId, teams]);
  const teamB = useMemo(() => teams.find((team) => team.id === teamBId), [teamBId, teams]);
  const selectedPlayers = [
    ...(teamA?.round_team_players ?? []).map((player) => ({ ...player, team_id: teamAId, side: "a" as const })),
    ...(teamB?.round_team_players ?? []).map((player) => ({ ...player, team_id: teamBId, side: "b" as const }))
  ];

  function setPlayerStat(userId: string, field: "goals_for" | "own_goals", value: number) {
    setGoals((current) => ({
      ...current,
      [userId]: {
        goals_for: current[userId]?.goals_for ?? 0,
        own_goals: current[userId]?.own_goals ?? 0,
        [field]: value
      }
    }));
  }

  function submit() {
    startTransition(async () => {
      const response = await createRoundMatchWithStatsAction({
        round_id: roundId,
        team_a_id: teamAId,
        team_b_id: teamBId,
        notes,
        stats: selectedPlayers.map((player) => ({
          user_id: player.user_id,
          team_id: player.team_id,
          side: player.side,
          goals_for: goals[player.user_id]?.goals_for ?? 0,
          own_goals: goals[player.user_id]?.own_goals ?? 0
        }))
      });
      setMessage(response.message);
      if (response.ok) router.refresh();
    });
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Time A">
          <select value={teamAId} onChange={(event) => setTeamAId(event.target.value)}>
            <option value="">Selecione</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Time B">
          <select value={teamBId} onChange={(event) => setTeamBId(event.target.value)}>
            <option value="">Selecione</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </Field>
      </div>

      {teamA && teamB ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {[teamA, teamB].map((team) => (
            <div key={team.id} className="rounded-md border border-zinc-200 p-4">
              <h3 className="font-semibold">{team.name}</h3>
              <div className="mt-3 space-y-2">
                {team.round_team_players?.map((player) => (
                  <div key={player.user_id} className="grid grid-cols-[1fr_76px_76px] items-center gap-2 rounded-md bg-zinc-50 p-2">
                    <span className="text-sm">{player.profiles?.name ?? "Jogador"}</span>
                    <label className="flex items-center gap-1" title="Gols pró">
                      <Goal size={16} className="text-field-700" />
                      <input
                        aria-label="Gols pró"
                        type="number"
                        min={0}
                        className="px-2 py-1"
                        value={goals[player.user_id]?.goals_for ?? 0}
                        onChange={(event) => setPlayerStat(player.user_id, "goals_for", Number(event.target.value))}
                      />
                    </label>
                    <label className="flex items-center gap-1" title="Gols contra">
                      <ShieldAlert size={16} className="text-red-700" />
                      <input
                        aria-label="Gols contra"
                        type="number"
                        min={0}
                        className="px-2 py-1"
                        value={goals[player.user_id]?.own_goals ?? 0}
                        onChange={(event) => setPlayerStat(player.user_id, "own_goals", Number(event.target.value))}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <Field label="Observações">
        <textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </Field>
      <Button type="button" disabled={!teamAId || !teamBId || teamAId === teamBId || isPending} onClick={submit}>
        {isPending ? "Registrando..." : "Registrar partida"}
      </Button>
      {message ? <p className="text-sm text-field-700">{message}</p> : null}
    </div>
  );
}

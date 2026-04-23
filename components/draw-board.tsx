"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Shuffle, Save } from "lucide-react";
import { saveDrawAction } from "@/app/actions";
import { Button, Card, Field } from "@/components/ui";

type Player = { id: string; name: string };
type Team = { name: string; players: Player[] };

export function DrawBoard({ roundId, players }: { roundId: string; players: Player[] }) {
  const [selected, setSelected] = useState<string[]>(players.map((player) => player.id));
  const [teamCount, setTeamCount] = useState(4);
  const [maxPlayers, setMaxPlayers] = useState(5);
  const [teams, setTeams] = useState<Team[]>([]);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const selectedPlayers = useMemo(() => players.filter((player) => selected.includes(player.id)), [players, selected]);

  useEffect(() => {
    setSelected((current) => {
      const available = new Set(players.map((player) => player.id));
      const kept = current.filter((id) => available.has(id));
      const added = players.map((player) => player.id).filter((id) => !kept.includes(id));
      return [...kept, ...added];
    });
  }, [players]);

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function draw() {
    const shuffled = [...selectedPlayers].sort(() => Math.random() - 0.5);
    const nextTeams: Team[] = Array.from({ length: teamCount }, (_, index) => ({ name: `Time ${index + 1}`, players: [] }));
    shuffled.slice(0, teamCount * maxPlayers).forEach((player, index) => {
      nextTeams[index % teamCount].players.push(player);
    });
    setTeams(nextTeams);
    setMessage("");
  }

  function movePlayer(playerId: string, fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    setTeams((current) => {
      const next = current.map((team) => ({ ...team, players: [...team.players] }));
      const player = next[fromIndex]?.players.find((item) => item.id === playerId);
      if (!player) return current;
      next[fromIndex].players = next[fromIndex].players.filter((item) => item.id !== playerId);
      next[toIndex].players.push(player);
      return next;
    });
  }

  function save() {
    startTransition(async () => {
      const response = await saveDrawAction({
        round_id: roundId,
        teams: teams.map((team) => ({ name: team.name, players: team.players.map((player) => player.id) }))
      });
      setMessage(response.message);
      if (response.ok) router.refresh();
    });
  }

  return (
    <Card>
      <h2 className="font-semibold">Sorteio de times</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Quantidade de times">
          <input type="number" min={2} value={teamCount} onChange={(event) => setTeamCount(Number(event.target.value))} />
        </Field>
        <Field label="Máximo por time">
          <input type="number" min={1} value={maxPlayers} onChange={(event) => setMaxPlayers(Number(event.target.value))} />
        </Field>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {!players.length ? (
          <p className="rounded-md border border-dashed border-zinc-300 p-4 text-sm text-zinc-600 sm:col-span-2">
            Nenhum jogador confirmado para sortear.
          </p>
        ) : null}
        {players.map((player) => (
          <label key={player.id} className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white p-3 text-sm">
            <input className="h-4 w-4" type="checkbox" checked={selected.includes(player.id)} onChange={() => toggle(player.id)} />
            {player.name}
          </label>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={draw}><Shuffle size={16} /> Sortear</Button>
        <Button type="button" variant="secondary" disabled={!teams.length || isPending} onClick={save}><Save size={16} /> Salvar sorteio</Button>
      </div>
      {message ? <p className="mt-3 text-sm text-field-700">{message}</p> : null}
      {teams.length ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {teams.map((team, teamIndex) => (
            <div key={team.name} className="rounded-md border border-zinc-200 p-4">
              <h3 className="font-semibold">{team.name}</h3>
              <div className="mt-3 space-y-2 text-sm text-zinc-700">
                {team.players.map((player) => (
                  <div key={player.id} className="flex items-center justify-between gap-2 rounded-md bg-zinc-50 px-3 py-2">
                    <span>{player.name}</span>
                    <select
                      aria-label={`Mover ${player.name}`}
                      className="w-28 py-1"
                      value={teamIndex}
                      onChange={(event) => movePlayer(player.id, teamIndex, Number(event.target.value))}
                    >
                      {teams.map((target, targetIndex) => (
                        <option key={target.name} value={targetIndex}>
                          {target.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                {!team.players.length ? <p className="text-zinc-500">Sem jogadores.</p> : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

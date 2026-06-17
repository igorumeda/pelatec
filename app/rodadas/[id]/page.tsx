import { CalendarCog, Shield, Trophy } from "lucide-react";
import { upsertRoundAction } from "@/app/actions";
import { ActionStateForm } from "@/components/action-state-form";
import { DateInput } from "@/components/date-input";
import { MatchRegistration } from "@/components/match-registration";
import { MyPresenceCard, PresenceAwareDrawBoard, PresenceListCard, RoundPresenceProvider } from "@/components/round-presence";
import { BackLink, Card, CardTitle, Field, PageHeader } from "@/components/ui";
import { canManage, getMyRole, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dateLabel, getRoundOperationalStatus, roundStatusLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PresenceStatus = "confirmed" | "declined" | "pending";

export default async function RoundDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: round } = await supabase
    .from("rounds")
    .select("*, peladas(id, name, venue)")
    .eq("id", id)
    .single();

  const role = round?.pelada_id ? await getMyRole(round.pelada_id) : undefined;
  const manageable = canManage(role);

  const { data: members } = round?.pelada_id
    ? await supabase
        .from("pelada_members")
        .select("user_id, role, profiles(id, name, email)")
        .eq("pelada_id", round.pelada_id)
        .order("created_at")
    : { data: [] };

  const { data: presence } = await supabase.from("round_presence").select("user_id, status").eq("round_id", id);
  const { data: teams } = await supabase
    .from("round_teams")
    .select("id, name, sort_order, round_team_players(user_id, profiles(name))")
    .eq("round_id", id)
    .order("sort_order");
  const { data: matches } = await supabase
    .from("round_matches")
    .select("*, team_a:round_teams!round_matches_team_a_id_fkey(name), team_b:round_teams!round_matches_team_b_id_fkey(name)")
    .eq("round_id", id);

  const presenceByUser = new Map((presence ?? []).map((row: any) => [row.user_id, row.status]));
  const memberPresence = (members ?? []).map((member: any) => ({
    user_id: member.user_id,
    role: member.role,
    profiles: member.profiles,
    status: (presenceByUser.get(member.user_id) ?? "pending") as PresenceStatus
  }));

  const matchTeams = (teams ?? []).map((team: any) => ({
    id: team.id,
    name: team.name,
    round_team_players: (team.round_team_players ?? []).map((player: any) => ({
      user_id: player.user_id,
      profiles: Array.isArray(player.profiles) ? player.profiles[0] : player.profiles
    }))
  }));
  const editAction = upsertRoundAction.bind(null, id);
  const operationalStatus = round ? getRoundOperationalStatus(round) : null;

  const presenceMembers = memberPresence.map((row) => ({
    user_id: row.user_id,
    name: row.profiles?.name ?? "Jogador",
    email: row.profiles?.email,
    status: row.status
  }));

  return (
    <RoundPresenceProvider roundId={id} currentUserId={user.id} initialMembers={presenceMembers}>
      <div className="mb-4">
        {round?.pelada_id ? <BackLink href={`/peladas/${round.pelada_id}`}>Voltar para a pelada</BackLink> : <BackLink href="/dashboard">Voltar ao painel</BackLink>}
      </div>
      <PageHeader
        title={round?.title ?? "Rodada"}
        description={round ? `${round.peladas?.name} - ${dateLabel(round.round_date)} as ${round.starts_at.slice(0, 5)} - ${roundStatusLabel(operationalStatus)}` : undefined}
        theme="dark"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <MyPresenceCard />
          {manageable ? <PresenceAwareDrawBoard roundId={id} /> : null}

          <Card>
            <CardTitle icon={Shield}>Times salvos</CardTitle>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {teams?.map((team: any) => (
                <div key={team.id} className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900">{team.name}</h3>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {team.round_team_players?.map((player: any) => (
                      <li key={player.user_id}>{(Array.isArray(player.profiles) ? player.profiles[0] : player.profiles)?.name}</li>
                    ))}
                  </ul>
                </div>
              ))}
              {!teams?.length ? <p className="text-sm text-slate-600">Nenhum sorteio salvo.</p> : null}
            </div>
          </Card>

          {manageable ? (
            <Card>
              <CardTitle icon={Trophy}>Registrar partida simples</CardTitle>
              <MatchRegistration roundId={id} teams={matchTeams} />
              <div className="mt-4 space-y-2">
                {matches?.map((match: any) => (
                  <div key={match.id} className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-700">
                    {match.team_a?.name ?? "Time A"} {match.team_a_score ?? "-"} x {match.team_b_score ?? "-"} {match.team_b?.name ?? "Time B"}
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>

        <aside className="space-y-6">
          <PresenceListCard canManage={manageable} />

          {manageable && round ? (
            <Card>
              <CardTitle icon={CalendarCog}>Editar rodada</CardTitle>
              <ActionStateForm action={editAction} submitLabel="Salvar" className="mt-4 space-y-4">
                <input type="hidden" name="pelada_id" value={round.pelada_id} />
                <Field label="Título"><input name="title" defaultValue={round.title ?? ""} /></Field>
                <Field label="Data"><DateInput name="round_date" required defaultValue={round.round_date} /></Field>
                <Field label="Início"><input name="starts_at" type="time" required defaultValue={round.starts_at.slice(0, 5)} /></Field>
                <Field label="Duração em minutos"><input name="duration_minutes" type="number" min="1" max="1440" defaultValue={round.duration_minutes ?? 120} /></Field>
                <Field label="Local"><input name="venue" defaultValue={round.venue ?? round.peladas?.venue ?? ""} /></Field>
                <Field label="Limite"><input name="player_limit" type="number" min="1" defaultValue={round.player_limit ?? ""} /></Field>
                <Field label="Status">
                  <select name="status" defaultValue={round.status}>
                    <option value="active">Ativa</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </Field>
                <Field label="Observações"><textarea name="notes" rows={3} defaultValue={round.notes ?? ""} /></Field>
              </ActionStateForm>
            </Card>
          ) : null}
        </aside>
      </div>
    </RoundPresenceProvider>
  );
}

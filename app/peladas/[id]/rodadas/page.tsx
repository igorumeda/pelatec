import { CalendarDays, CalendarPlus2 } from "lucide-react";
import { upsertRoundAction } from "@/app/actions";
import { ActionStateForm } from "@/components/action-state-form";
import { RoundFormFields } from "@/components/round-form-fields";
import { RoundsListManager, type ManagedRound } from "@/components/rounds-list-manager";
import { BackLink, Card, CardTitle, PageHeader } from "@/components/ui";
import { canManage, getMyRole, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRoundOperationalStatus } from "@/lib/utils";

export default async function RoundsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const role = await getMyRole(id);
  const supabase = await createClient();
  const { data: pelada } = await supabase.from("peladas").select("name, venue, venue_address, default_time").eq("id", id).single();
  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .eq("pelada_id", id)
    .order("round_date", { ascending: false });
  const roundIds = rounds?.map((round: any) => round.id) ?? [];
  const { data: confirmedPresence } = roundIds.length
    ? await supabase
      .from("round_presence")
      .select("round_id")
      .in("round_id", roundIds)
      .eq("status", "confirmed")
    : { data: [] };
  const { data: roundMatches } = roundIds.length
    ? await supabase
      .from("round_matches")
      .select("round_id")
      .in("round_id", roundIds)
    : { data: [] };
  const confirmedCountByRound = countByRoundId(confirmedPresence ?? []);
  const matchCountByRound = countByRoundId(roundMatches ?? []);
  const managedRounds = (rounds ?? []).map((round: any) => ({
    id: round.id,
    title: round.title,
    round_date: round.round_date,
    starts_at: round.starts_at,
    duration_minutes: round.duration_minutes,
    status: round.status,
    operationalStatus: getRoundOperationalStatus(round),
    confirmedCount: confirmedCountByRound.get(round.id) ?? 0,
    matchCount: matchCountByRound.get(round.id) ?? 0
  })) satisfies ManagedRound[];
  const action = upsertRoundAction.bind(null, null);

  return (
    <>
      <div className="mb-4">
        <BackLink href={`/peladas/${id}`}>Voltar para a pelada</BackLink>
      </div>
      <PageHeader title="Agenda" description={`Rodadas da ${pelada?.name ?? "pelada"}.`} theme="dark" />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardTitle icon={CalendarDays}>Rodadas cadastradas</CardTitle>
          <RoundsListManager peladaId={id} rounds={managedRounds} canManage={canManage(role)} />
        </Card>

        {canManage(role) ? (
          <Card>
            <CardTitle icon={CalendarPlus2}>Criar rodada</CardTitle>
            <ActionStateForm action={action} submitLabel="Criar" className="mt-4 space-y-4">
              <input type="hidden" name="pelada_id" value={id} />
              <RoundFormFields
                defaultTime={pelada?.default_time}
                defaultVenue={pelada?.venue_address ?? pelada?.venue ?? ""}
              />
              <input type="hidden" name="status" value="active" />
            </ActionStateForm>
          </Card>
        ) : null}
      </div>
    </>
  );
}

function countByRoundId(rows: Array<{ round_id: string }>) {
  const counts = new Map<string, number>();
  rows.forEach((row) => counts.set(row.round_id, (counts.get(row.round_id) ?? 0) + 1));
  return counts;
}

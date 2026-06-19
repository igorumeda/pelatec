import { Compass } from "lucide-react";
import { ExploreClient, type ExplorePelada, type ExplorePlayer } from "@/components/explore-client";
import { Card, CardTitle, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ExplorePage() {
  const user = await requireUser();
  const supabase = await createClient();
  const [peladasResult, playersResult, profileResult, membershipsResult, joinRequestsResult] = await Promise.all([
    supabase.rpc("get_explore_peladas"),
    supabase.rpc("get_explore_players"),
    supabase
      .from("profiles")
      .select("last_lat, last_lng, last_location_at, last_location_label, last_location_source")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("pelada_members")
      .select("pelada_id")
      .eq("user_id", user.id),
    supabase
      .from("pelada_join_requests")
      .select("pelada_id")
      .eq("user_id", user.id)
      .eq("status", "pending")
  ]);

  if (peladasResult.error) throw new Error(peladasResult.error.message);
  if (playersResult.error) throw new Error(playersResult.error.message);

  const memberPeladaIds = new Set((membershipsResult.data ?? []).map((row: any) => row.pelada_id));
  const requestedPeladaIds = new Set((joinRequestsResult.data ?? []).map((row: any) => row.pelada_id));
  const peladas = ((peladasResult.data ?? []) as ExplorePelada[]).map((pelada) => ({
    ...pelada,
    viewer_status: memberPeladaIds.has(pelada.id)
      ? "member"
      : requestedPeladaIds.has(pelada.id)
        ? "requested"
        : null
  })) satisfies ExplorePelada[];

  return (
    <>
      <PageHeader
        title="Explorar"
        description="Encontre peladas públicas e jogadores na redondeza usando sua localização atual."
        theme="dark"
      />

      <Card>
        <CardTitle icon={Compass}>Descoberta local</CardTitle>
        <ExploreClient
          peladas={peladas}
          players={(playersResult.data ?? []) as ExplorePlayer[]}
          initialLocation={profileResult.data ?? null}
        />
      </Card>
    </>
  );
}

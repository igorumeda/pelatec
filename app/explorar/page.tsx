import { Compass } from "lucide-react";
import { ExploreClient, type ExplorePelada, type ExplorePlayer } from "@/components/explore-client";
import { Card, CardTitle, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ExplorePage() {
  const user = await requireUser();
  const supabase = await createClient();
  const [peladasResult, playersResult, profileResult] = await Promise.all([
    supabase.rpc("get_explore_peladas"),
    supabase.rpc("get_explore_players"),
    supabase
      .from("profiles")
      .select("last_lat, last_lng, last_location_at, last_location_label, last_location_source")
      .eq("id", user.id)
      .maybeSingle()
  ]);

  if (peladasResult.error) throw new Error(peladasResult.error.message);
  if (playersResult.error) throw new Error(playersResult.error.message);

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
          peladas={(peladasResult.data ?? []) as ExplorePelada[]}
          players={(playersResult.data ?? []) as ExplorePlayer[]}
          initialLocation={profileResult.data ?? null}
        />
      </Card>
    </>
  );
}

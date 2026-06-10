import { Compass } from "lucide-react";
import { ExploreClient, type ExplorePelada, type ExplorePlayer } from "@/components/explore-client";
import { Card, CardTitle, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ExplorePage() {
  await requireUser();
  const supabase = await createClient();
  const [peladasResult, playersResult] = await Promise.all([
    supabase.rpc("get_explore_peladas"),
    supabase.rpc("get_explore_players")
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
        />
      </Card>
    </>
  );
}

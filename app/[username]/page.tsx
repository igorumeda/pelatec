import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Dumbbell, Gauge, Goal, MoveRight, Pencil, Shield, Timer, UserRound } from "lucide-react";
import { PlayerSkillRadar } from "@/components/player-skill-radar";
import { DEFAULT_AVATAR_SRC } from "@/components/user-avatar";
import { createClient } from "@/lib/supabase/server";
import { playerPositionLabel } from "@/lib/utils";

type PublicProfileRow = {
  id: string;
  username: string;
  name: string;
  nickname: string | null;
  avatar_url: string | null;
  age: number | null;
  position: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  play_style: string | null;
  player_description: string | null;
  shooting: number;
  dribbling: number;
  passing: number;
  strength: number;
  speed: number;
  defense: number;
};

const facts = [
  { key: "position", label: "Posicao", icon: Goal },
  { key: "age", label: "Idade", icon: Timer },
  { key: "height_cm", label: "Altura", icon: MoveRight },
  { key: "weight_kg", label: "Peso", icon: Dumbbell },
  { key: "play_style", label: "Estilo", icon: Gauge }
] as const;

export default async function PublicPlayerProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_profile_by_username", {
    target_username: username
  });

  if (error) throw new Error(error.message);

  const profile = (data?.[0] ?? null) as PublicProfileRow | null;
  if (!profile) notFound();

  const {
    data: { user }
  } = await supabase.auth.getUser();
  const isOwnProfile = user?.id === profile.id;

  const displayName = profile.nickname?.trim() || profile.name;
  const avatarSrc = profile.avatar_url || DEFAULT_AVATAR_SRC;

  const strongestAttribute = [
    ["Chute", profile.shooting],
    ["Drible", profile.dribbling],
    ["Passe", profile.passing],
    ["Forca", profile.strength],
    ["Velocidade", profile.speed],
    ["Defesa", profile.defense]
  ].sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] ?? "Em definicao";

  return (
    <div className="mx-auto max-w-6xl">
      <section className="overflow-hidden rounded-[36px] border border-cyan-300/15 bg-[radial-gradient(circle_at_top_left,_rgba(35,209,170,0.25),_transparent_32%),linear-gradient(145deg,_#171244_0%,_#0e1831_58%,_#08111f_100%)] shadow-2xl">
        <div className="grid items-stretch gap-8 px-6 py-8 lg:grid-cols-[1.15fr,0.85fr] lg:px-8">
          <div className="flex h-full flex-col rounded-[30px] border border-cyan-300/12 bg-white/5 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/85">Player Card</p>
                <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{displayName}</h1>
                <p className="mt-2 text-base text-slate-200">
                  @{profile.username} {profile.position ? `- ${playerPositionLabel(profile.position)}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:items-end">
                {isOwnProfile ? (
                  <Link
                    href="/perfil"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    <Pencil size={16} />
                    Editar perfil
                  </Link>
                ) : null}
                <div className="rounded-3xl border border-cyan-300/15 bg-white/8 px-4 py-3 text-right">
                  <p className="text-[11px] uppercase tracking-[0.26em] text-cyan-200/80">Jogador</p>
                  <p className="mt-1 text-2xl font-black text-white">
                    {profile.position ? playerPositionLabel(profile.position) : "--"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <PlayerSkillRadar
                values={{
                  shooting: profile.shooting,
                  dribbling: profile.dribbling,
                  passing: profile.passing,
                  strength: profile.strength,
                  speed: profile.speed,
                  defense: profile.defense
                }}
              />
            </div>

            <div className="mt-6 flex-1 rounded-[28px] border border-white/10 bg-white/5 p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/12 text-cyan-100">
                  <UserRound size={20} />
                </span>
                <div>
                  <p className="font-semibold text-white">Informacoes do jogador</p>
                  <p className="text-sm text-slate-300">Perfil publico com estilo de card de jogo.</p>
                </div>
              </div>
              <div className="divide-y divide-white/10">
                {facts.map((fact) => {
                  let value = "--";
                  if (fact.key === "position") value = profile.position ? playerPositionLabel(profile.position) : "--";
                  if (fact.key === "age") value = profile.age ? `${profile.age} anos` : "--";
                  if (fact.key === "height_cm") value = profile.height_cm ? `${profile.height_cm} cm` : "--";
                  if (fact.key === "weight_kg") value = profile.weight_kg ? `${profile.weight_kg} kg` : "--";
                  if (fact.key === "play_style") value = profile.play_style || "--";

                  const Icon = fact.icon;
                  return (
                    <div key={fact.key} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-3 text-slate-200">
                        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/8 text-cyan-100">
                          <Icon size={16} />
                        </span>
                        <span className="text-sm font-medium">{fact.label}</span>
                      </div>
                      <span className="text-right text-sm font-semibold text-white">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="h-full">
            <div className="relative flex h-full flex-col overflow-hidden rounded-[30px] border border-cyan-300/12 bg-[linear-gradient(180deg,_rgba(23,139,255,0.12),_rgba(11,17,31,0.08)),radial-gradient(circle_at_top,_rgba(110,231,255,0.18),_transparent_45%)] px-6 pt-10">
              <div className="absolute inset-x-8 top-8 h-48 rounded-full bg-cyan-300/10 blur-3xl" />
              <div className="absolute left-6 top-6 z-20 rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.26em] text-cyan-200/80">Estilo</p>
                <p className="mt-1 text-lg font-bold text-white">{profile.play_style || "Jogador de area"}</p>
              </div>
              <div className="relative z-10 flex min-h-[340px] items-start justify-center pt-24">
                <div className="relative h-64 w-64 overflow-hidden rounded-full border-4 border-cyan-200/25 bg-white/8 shadow-2xl sm:h-72 sm:w-72">
                  <Image
                    src={avatarSrc}
                    alt={`Foto de ${displayName}`}
                    fill
                    sizes="(max-width: 640px) 256px, 288px"
                    unoptimized={!profile.avatar_url}
                    className="object-cover object-top"
                  />
                </div>
              </div>
              <div className="relative z-10 mt-4 flex-1 pb-6">
                <div className="space-y-3 rounded-[24px] border border-white/10 bg-[#091120]/65 p-4 backdrop-blur">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white/6 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Nome em campo</p>
                      <p className="mt-1 text-base font-semibold text-white">{displayName}</p>
                    </div>
                    <div className="rounded-2xl bg-white/6 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Usuario</p>
                      <p className="mt-1 text-base font-semibold text-white">@{profile.username}</p>
                    </div>
                  </div>
                  <div className="border-t border-white/10 pt-3">
                    <div className="mb-3 flex items-center gap-2">
                      <Shield size={16} className="text-cyan-100" />
                      <p className="text-sm font-semibold text-white">Resumo tecnico</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white/6 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Perfil</p>
                        <p className="mt-1 text-base font-semibold text-white">
                          {profile.position ? playerPositionLabel(profile.position) : "Nao informado"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/6 p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Atributo forte</p>
                        <p className="mt-1 text-base font-semibold text-white">{strongestAttribute}</p>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/80">Sobre o jogador</p>
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-100">
                      {profile.player_description || "Este jogador ainda nao escreveu sua descricao pessoal."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

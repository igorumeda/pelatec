"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, ImageUp, Shield } from "lucide-react";
import { Field, LinkButton } from "@/components/ui";
import { UserAvatar } from "@/components/user-avatar";
import { type PlayerPosition, type Profile } from "@/lib/types";
import { cn, playerPositionLabel, totalSkillPoints } from "@/lib/utils";

const playStyles = [
  "Brutamontes",
  "Corredor",
  "Driblador",
  "Goleador",
  "Passador",
  "Armador",
  "Marcador",
  "Finalizador",
  "Pulmao do time",
  "Canhao de fora da area"
];

const skillConfig = [
  { key: "shooting", label: "Chute" },
  { key: "dribbling", label: "Drible" },
  { key: "passing", label: "Passe" },
  { key: "strength", label: "Forca" },
  { key: "speed", label: "Velocidade" },
  { key: "defense", label: "Defesa" }
] as const;

type SkillKey = (typeof skillConfig)[number]["key"];
type SkillState = Record<SkillKey, number>;

const positionOptions: PlayerPosition[] = ["striker", "midfielder", "fullback", "center_back", "goalkeeper"];
const maxAvatarSizeMb = 5;
const maxAvatarSizeBytes = maxAvatarSizeMb * 1024 * 1024;

export function ProfileEditorFields({ profile }: { profile: Partial<Profile> | null | undefined }) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarName, setAvatarName] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [skills, setSkills] = useState<SkillState>({
    shooting: Number(profile?.shooting ?? 0),
    dribbling: Number(profile?.dribbling ?? 0),
    passing: Number(profile?.passing ?? 0),
    strength: Number(profile?.strength ?? 0),
    speed: Number(profile?.speed ?? 0),
    defense: Number(profile?.defense ?? 0)
  });

  const totalPoints = useMemo(() => totalSkillPoints(skills), [skills]);
  const remainingPoints = 10 - totalPoints;

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarPreview(null);
    setAvatarName(null);
    setAvatarError(null);

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      event.target.value = "";
      setAvatarError("Selecione uma imagem em JPG, PNG ou WebP.");
      return;
    }

    if (file.size > maxAvatarSizeBytes) {
      event.target.value = "";
      setAvatarError(`A imagem deve ter no maximo ${maxAvatarSizeMb} MB.`);
      return;
    }

    setAvatarPreview(URL.createObjectURL(file));
    setAvatarName(file.name);
  }

  function updateSkill(key: SkillKey, nextValue: number) {
    setSkills((current) => {
      const sanitized = Number.isNaN(nextValue) ? 0 : Math.max(0, Math.min(10, Math.round(nextValue)));
      const currentValue = current[key];
      const others = totalSkillPoints(current) - currentValue;
      const allowed = Math.max(0, Math.min(10, 10 - others));
      return {
        ...current,
        [key]: Math.min(sanitized, allowed)
      };
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome">
          <input name="name" required defaultValue={profile?.name ?? ""} />
        </Field>
        <Field label="Nome de usuario">
          <input
            name="username"
            required
            defaultValue={profile?.username ?? ""}
            placeholder="ex: igor_umeda"
            autoCapitalize="none"
            autoCorrect="off"
          />
        </Field>
        <Field label="E-mail">
          <input value={profile?.email ?? ""} disabled />
        </Field>
        <Field label="Telefone">
          <input name="phone" defaultValue={profile?.phone ?? ""} placeholder="Opcional" />
        </Field>
        <Field label="Apelido">
          <input name="nickname" defaultValue={profile?.nickname ?? ""} placeholder="Como o pessoal te chama" />
        </Field>
        <Field label="Idade">
          <input name="age" type="number" min={10} max={99} defaultValue={profile?.age ?? ""} />
        </Field>
        <Field label="Posicao">
          <select name="position" defaultValue={profile?.position ?? ""}>
            <option value="">Selecione</option>
            {positionOptions.map((position) => (
              <option key={position} value={position}>
                {playerPositionLabel(position)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Estilo de jogo">
          <input
            name="play_style"
            defaultValue={profile?.play_style ?? ""}
            list="play-style-options"
            placeholder="Ex: Corredor"
          />
          <datalist id="play-style-options">
            {playStyles.map((style) => (
              <option key={style} value={style} />
            ))}
          </datalist>
        </Field>
        <Field label="Altura (cm)">
          <input name="height_cm" type="number" min={120} max={240} defaultValue={profile?.height_cm ?? ""} />
        </Field>
        <Field label="Peso (kg)">
          <input name="weight_kg" type="number" min={35} max={200} defaultValue={profile?.weight_kg ?? ""} />
        </Field>
      </div>

      <Field label="Descricao pessoal do jogador">
        <textarea
          name="player_description"
          rows={5}
          maxLength={600}
          defaultValue={profile?.player_description ?? ""}
          placeholder="Conte, com suas palavras, como voce joga, o que gosta de fazer em campo e que tipo de parceiro de time voce e."
        />
      </Field>

      <div className="grid gap-5 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-3xl border border-panel-200 bg-panel-50/85 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Habilidades do jogador</p>
              <p className="mt-1 text-sm text-slate-600">
                Distribua ate 10 pontos no total. Cada habilidade vai de 0 a 10.
              </p>
            </div>
            <div className="rounded-2xl border border-brand-700/20 bg-brand-700/8 px-3 py-2 text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-900">Pontos restantes</p>
              <p className={cn("text-2xl font-extrabold", remainingPoints < 0 ? "text-red-600" : "text-brand-950")}>
                {remainingPoints}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {skillConfig.map((skill) => {
              const currentValue = skills[skill.key];
              const canIncrease = remainingPoints > 0;
              return (
                <div key={skill.key} className="rounded-2xl border border-panel-200 bg-white/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-semibold text-slate-900">{skill.label}</label>
                    <span className="rounded-xl bg-brand-950 px-2.5 py-1 text-sm font-semibold text-white">
                      {currentValue}/10
                    </span>
                  </div>
                  <div className="mt-3 grid items-center gap-3 sm:grid-cols-[1fr,92px]">
                    <input
                      name={skill.key}
                      type="range"
                      min={0}
                      max={10}
                      value={currentValue}
                      aria-valuetext={
                        canIncrease || currentValue > 0
                          ? `${currentValue} de 10`
                          : "Sem pontos restantes para aumentar"
                      }
                      onChange={(event) => updateSkill(skill.key, Number(event.target.value))}
                    />
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={currentValue}
                      onChange={(event) => updateSkill(skill.key, Number(event.target.value))}
                      className="text-center"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-panel-200 bg-panel-50/85 p-4">
            <Field label="Foto de perfil">
              <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-panel-300 bg-white/70 px-4 py-6 text-center text-sm text-slate-600 transition hover:border-brand-700/35 hover:bg-white">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt="Preview da foto selecionada"
                    className="h-20 w-20 rounded-full border border-panel-200 object-cover shadow-sm"
                  />
                ) : (
                  <UserAvatar
                    src={profile?.avatar_url}
                    name={profile?.name ?? "jogador"}
                    size={80}
                    className="h-20 w-20 border border-panel-200 shadow-sm"
                  />
                )}
                <span className="font-semibold text-slate-900">Anexar foto de perfil</span>
                <span>
                  {avatarName
                    ? `Arquivo selecionado: ${avatarName}`
                    : `Imagem JPG, PNG ou WebP ate ${maxAvatarSizeMb} MB. Ao salvar, ela substitui a foto atual.`}
                </span>
                <span className="inline-flex items-center gap-2 rounded-xl bg-brand-950 px-3 py-2 text-xs font-semibold text-white">
                  <ImageUp size={15} />
                  Escolher imagem
                </span>
                {avatarError ? <span className="text-sm font-medium text-red-600">{avatarError}</span> : null}
                <input
                  name="avatar"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={handleAvatarChange}
                />
              </label>
            </Field>
            <input type="hidden" name="avatar_url" value={profile?.avatar_url ?? ""} />
          </div>

          <div className="rounded-3xl border border-panel-200 bg-panel-50/85 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-700/10 text-brand-900">
                <Shield size={18} />
              </span>
              <div>
                <p className="font-semibold text-slate-900">Perfil publico</p>
                <p className="mt-1 text-sm text-slate-600">
                  Seu perfil fica disponivel para qualquer pessoa pelo seu nome de usuario.
                </p>
              </div>
            </div>
            {profile?.username ? (
              <div className="mt-4">
                <LinkButton href={`/${profile.username}`} variant="secondary" className="w-full">
                  <ExternalLink size={16} />
                  Ver perfil publico
                </LinkButton>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

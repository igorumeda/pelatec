"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  bulkChargeSchema,
  cancelPaymentSchema,
  cancelChargeSchema,
  chargeSchema,
  drawSchema,
  financialEntrySchema,
  loginSchema,
  memberRoleSchema,
  memberSchema,
  paymentSchema,
  peladaSchema,
  passwordRecoverySchema,
  passwordUpdateSchema,
  playerPaymentSchema,
  presenceSchema,
  profileSchema,
  roundMatchSchema,
  roundMatchWithStatsSchema,
  roundSchema,
  reviewPaymentSchema,
  signupSchema,
  userLocationSchema,
  verifySignupCodeSchema
} from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { getRoundOperationalStatus } from "@/lib/utils";

function values(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function revalidateAppShell() {
  revalidatePath("/", "layout");
}

function actionError(error: unknown) {
  if (error instanceof z.ZodError) {
    return { ok: false, message: error.issues[0]?.message ?? "Dados inválidos" };
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    String((error as { code?: string }).code) === "23505"
  ) {
    const message = "message" in error ? String((error as { message?: string }).message) : "";
    if (message.includes("peladas_public_slug")) {
      return { ok: false, message: "Essa URL pública da pelada já esta em uso. Tente outra." };
    }
    return { ok: false, message: "Esse nome de usuário já está em uso. Tente outro." };
  }
  if (error instanceof Error) return { ok: false, message: error.message };
  if (typeof error === "object" && error !== null && "message" in error) {
    return { ok: false, message: String(error.message) };
  }
  return { ok: false, message: "Não foi possível concluir a operação" };
}

async function getAuthenticatedStorageClient(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Sua sessão expirou. Entre novamente para enviar imagens.");
  }

  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      }
    }
  );
}

async function uploadImageFromForm({
  supabase,
  formData,
  field,
  bucket,
  pathPrefix,
  currentUrl,
  label
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  formData: FormData;
  field: string;
  bucket: string;
  pathPrefix: string;
  currentUrl?: string;
  label: string;
}) {
  const image = formData.get(field);
  if (!(image instanceof File) || image.size === 0) return currentUrl;

  if (!image.type.startsWith("image/")) {
    throw new Error(`Selecione uma imagem válida para ${label}.`);
  }

  if (image.size > 5 * 1024 * 1024) {
    throw new Error(`A imagem de ${label} deve ter no máximo 5 MB.`);
  }

  const storageClient = await getAuthenticatedStorageClient(supabase);
  const safeName = image.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${pathPrefix}/${field}-${Date.now()}-${safeName}`;
  const { error: uploadError } = await storageClient.storage.from(bucket).upload(path, image, {
    contentType: image.type || undefined,
    upsert: false
  });

  if (uploadError) throw new Error(`Não foi possivel enviar ${label}: ${uploadError.message}`);

  const { data } = storageClient.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function signUpAction(_: unknown, formData: FormData) {
  const supabase = await createClient();
  try {
    const input = signupSchema.parse(values(formData));
    const { error } = await supabase.auth.signInWithOtp({
      email: input.email,
      options: {
        shouldCreateUser: true,
        data: { name: input.name }
      }
    });
    if (error) throw error;
  } catch (error) {
    return actionError(error);
  }
  const input = signupSchema.parse(values(formData));
  redirect(`/signup/confirmar?email=${encodeURIComponent(input.email)}&name=${encodeURIComponent(input.name)}`);
}

export async function verifySignupCodeAction(_: unknown, formData: FormData) {
  const supabase = await createClient();
  try {
    const input = verifySignupCodeSchema.parse(values(formData));
    const { error } = await supabase.auth.verifyOtp({
      email: input.email,
      token: input.token,
      type: "email"
    });
    if (error) throw error;
  } catch (error) {
    return actionError(error);
  }

  redirect("/criar-senha");
}

export async function signInAction(_: unknown, formData: FormData) {
  const supabase = await createClient();
  try {
    const input = loginSchema.parse(values(formData));
    const { error } = await supabase.auth.signInWithPassword(input);
    if (error) throw error;
  } catch (error) {
    return actionError(error);
  }
  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function recoverPasswordAction(_: unknown, formData: FormData) {
  const supabase = await createClient();
  try {
    const input = passwordRecoverySchema.parse(values(formData));
    const origin = (await headers()).get("origin") ?? "http://localhost:3000";
    const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
      redirectTo: `${origin}/auth/callback?next=/atualizar-senha`
    });
    if (error) throw error;
    return { ok: true, message: "Enviamos o link de recuperação para seu e-mail." };
  } catch (error) {
    return actionError(error);
  }
}

export async function updatePasswordAction(_: unknown, formData: FormData) {
  const supabase = await createClient();
  try {
    const input = passwordUpdateSchema.parse(values(formData));
    const { error } = await supabase.auth.updateUser({ password: input.password });
    if (error) throw error;
  } catch (error) {
    return actionError(error);
  }
  redirect("/onboarding");
}

export async function updateProfileAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  let redirectTo: string | null = null;
  try {
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    const input = profileSchema.parse(values(formData));
    let avatarUrl = input.avatar_url;
    const avatar = formData.get("avatar");

    if (avatar instanceof File && avatar.size > 0) {
      if (!avatar.type.startsWith("image/")) {
        throw new Error("Selecione uma imagem válida para a foto de perfil.");
      }
      if (avatar.size > 5 * 1024 * 1024) {
        throw new Error("A foto de perfil deve ter no máximo 5 MB.");
      }
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Sua sessão expirou. Entre novamente para enviar a foto.");
      }
      const storageClient = createSupabaseJsClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          },
          global: {
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          }
        }
      );
      const safeName = avatar.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${user.id}/avatar-${Date.now()}-${safeName}`;
      const { error: uploadError } = await storageClient.storage.from("profile-avatars").upload(path, avatar, {
        contentType: avatar.type || undefined,
        upsert: false
      });
      if (uploadError) throw new Error(`Não foi possivel enviar a foto: ${uploadError.message}`);
      const { data: publicAvatar } = storageClient.storage.from("profile-avatars").getPublicUrl(path);
      avatarUrl = publicAvatar.publicUrl;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      email: user.email ?? "",
      ...input,
      avatar_url: avatarUrl
    });
    if (error) throw error;
    redirectTo = formData.get("_redirect_to") === "/dashboard" ? "/dashboard" : null;
    revalidatePath("/perfil");
    if (currentProfile?.username && currentProfile.username !== input.username) {
      revalidatePath(`/${currentProfile.username}`);
    }
    revalidatePath(`/${input.username}`);
    revalidateAppShell();
    if (!redirectTo) return { ok: true, message: "Perfil atualizado" };
  } catch (error) {
    return actionError(error);
  }
  if (redirectTo) redirect(redirectTo);
}

export async function createPeladaAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const peladaId = crypto.randomUUID();
  try {
    const input = peladaSchema.parse(values(formData));
    const crestUrl = await uploadImageFromForm({
      supabase,
      formData,
      field: "crest",
      bucket: "pelada-assets",
      pathPrefix: `${user.id}/${peladaId}`,
      currentUrl: input.crest_url,
      label: "o brasao"
    });
    const bannerUrl = await uploadImageFromForm({
      supabase,
      formData,
      field: "banner",
      bucket: "pelada-assets",
      pathPrefix: `${user.id}/${peladaId}`,
      currentUrl: input.banner_url,
      label: "o banner"
    });
    const payload = {
      ...input,
      crest_url: crestUrl,
      banner_url: bannerUrl,
      public_slug: input.public_slug ?? null
    };
    const { error } = await supabase
      .from("peladas")
      .insert({ id: peladaId, ...payload, created_by: user.id });
    if (error) throw error;
    const { error: memberError } = await supabase
      .from("pelada_members")
      .insert({ pelada_id: peladaId, user_id: user.id, role: "owner", member_type: "monthly" });
    if (memberError) throw memberError;
  } catch (error) {
    return actionError(error);
  }
  redirect(`/peladas/${peladaId}`);
}

export async function updatePeladaAction(id: string, _: unknown, formData: FormData) {
  await requireUser();
  const supabase = await createClient();
  try {
    const { data: currentPelada } = await supabase
      .from("peladas")
      .select("crest_url, banner_url, public_slug")
      .eq("id", id)
      .maybeSingle();
    const input = peladaSchema.parse(values(formData));
    const crestUrl = await uploadImageFromForm({
      supabase,
      formData,
      field: "crest",
      bucket: "pelada-assets",
      pathPrefix: `peladas/${id}`,
      currentUrl: input.crest_url ?? currentPelada?.crest_url ?? undefined,
      label: "o brasao"
    });
    const bannerUrl = await uploadImageFromForm({
      supabase,
      formData,
      field: "banner",
      bucket: "pelada-assets",
      pathPrefix: `peladas/${id}`,
      currentUrl: input.banner_url ?? currentPelada?.banner_url ?? undefined,
      label: "o banner"
    });
    const payload = {
      ...input,
      crest_url: crestUrl,
      banner_url: bannerUrl,
      public_slug: input.public_slug ?? null
    };
    const { error } = await supabase.from("peladas").update(payload).eq("id", id);
    if (error) throw error;
    revalidatePath(`/peladas/${id}`);
    if (currentPelada?.public_slug) revalidatePath(`/pelada/${currentPelada.public_slug}`);
    if (input.public_slug) revalidatePath(`/pelada/${input.public_slug}`);
    return { ok: true, message: "Pelada atualizada" };
  } catch (error) {
    return actionError(error);
  }
}

export async function addMemberAction(_: unknown, formData: FormData) {
  await requireUser();
  const supabase = await createClient();
  try {
    const input = memberSchema.parse(values(formData));
    const { data: profileId, error: findError } = await supabase.rpc("find_profile_id_by_email", {
      target_email: input.email
    });
    if (findError) throw findError;
    if (!profileId) throw new Error("Usuário não encontrado. Ele precisa criar conta primeiro.");
    const { error } = await supabase
      .from("pelada_members")
      .upsert({ pelada_id: input.pelada_id, user_id: profileId, role: input.role, member_type: input.member_type });
    if (error) throw error;
    revalidatePath(`/peladas/${input.pelada_id}/membros`);
    return { ok: true, message: "Membro adicionado" };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateMemberRoleAction(_: unknown, formData: FormData) {
  await requireUser();
  const supabase = await createClient();
  try {
    const input = memberRoleSchema.parse(values(formData));
    const { error } = await supabase
      .from("pelada_members")
      .update({ role: input.role, member_type: input.member_type })
      .eq("pelada_id", input.pelada_id)
      .eq("user_id", input.user_id);
    if (error) throw error;
    revalidatePath(`/peladas/${input.pelada_id}/membros`);
    return { ok: true, message: "Papel atualizado" };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateMemberRoleFormAction(formData: FormData) {
  await updateMemberRoleAction(null, formData);
}

const recurrenceFields = [
  "recurrence_enabled",
  "recurrence_interval",
  "recurrence_unit",
  "recurrence_weekdays",
  "recurrence_end_type",
  "recurrence_until",
  "recurrence_count"
] as const;

function roundPayload(input: ReturnType<typeof roundSchema.parse>) {
  const payload = { ...input };
  for (const field of recurrenceFields) {
    delete payload[field];
  }
  return payload;
}

function localDateFromIso(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isoFromLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  const day = next.getDate();
  next.setMonth(next.getMonth() + months);
  if (next.getDate() !== day) next.setDate(0);
  return next;
}

function recurrenceDates(input: ReturnType<typeof roundSchema.parse>) {
  if (!input.recurrence_enabled) return [input.round_date];

  const start = localDateFromIso(input.round_date);
  const until = input.recurrence_end_type === "on" && input.recurrence_until
    ? localDateFromIso(input.recurrence_until)
    : null;
  const maxOccurrences = input.recurrence_end_type === "after" ? input.recurrence_count : 99;
  const dates: string[] = [];

  if (input.recurrence_unit === "month") {
    for (let index = 0; dates.length < maxOccurrences && index < 120; index += input.recurrence_interval) {
      const next = addMonths(start, index);
      if (until && next > until) break;
      dates.push(isoFromLocalDate(next));
    }
    return dates;
  }

  const selectedWeekdays = new Set((input.recurrence_weekdays ?? []).map(Number));
  const cursor = new Date(start);
  const maxDays = 366;

  for (let dayOffset = 0; dayOffset <= maxDays && dates.length < maxOccurrences; dayOffset += 1) {
    const weekDistance = Math.floor(dayOffset / 7);
    const sameInterval = weekDistance % input.recurrence_interval === 0;
    if (sameInterval && selectedWeekdays.has(cursor.getDay())) {
      if (until && cursor > until) break;
      dates.push(isoFromLocalDate(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function formatDatePt(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

async function ensureRoundScheduleIsAvailable({
  supabase,
  peladaId,
  dates,
  startsAt,
  ignoreRoundId
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  peladaId: string;
  dates: string[];
  startsAt: string;
  ignoreRoundId?: string | null;
}) {
  const uniqueDates = Array.from(new Set(dates));
  if (!uniqueDates.length) return;

  let query = supabase
    .from("rounds")
    .select("id, round_date, starts_at")
    .eq("pelada_id", peladaId)
    .eq("starts_at", startsAt)
    .in("round_date", uniqueDates)
    .limit(1);

  if (ignoreRoundId) {
    query = query.neq("id", ignoreRoundId);
  }

  const { data, error } = await query;
  if (error) throw error;
  const conflict = data?.[0];
  if (conflict) {
    throw new Error(`Já existe uma rodada cadastrada em ${formatDatePt(conflict.round_date)} às ${String(conflict.starts_at).slice(0, 5)}.`);
  }
}

export async function upsertRoundAction(roundId: string | null, _: unknown, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  try {
    const input = roundSchema.parse(values(formData));
    const payload = roundPayload(input);
    if (roundId) {
      await ensureRoundScheduleIsAvailable({
        supabase,
        peladaId: input.pelada_id,
        dates: [input.round_date],
        startsAt: input.starts_at,
        ignoreRoundId: roundId
      });
      const { error } = await supabase.from("rounds").update(payload).eq("id", roundId);
      if (error) throw error;
    } else {
      const dates = recurrenceDates(input);
      await ensureRoundScheduleIsAvailable({
        supabase,
        peladaId: input.pelada_id,
        dates,
        startsAt: input.starts_at
      });
      const { data: createdRounds, error } = await supabase
        .from("rounds")
        .insert(dates.map((roundDate) => ({ ...payload, round_date: roundDate, created_by: user.id })))
        .select("id");
      if (error) throw error;
      const { data: members } = await supabase
        .from("pelada_members")
        .select("user_id")
        .eq("pelada_id", input.pelada_id);
      if (members?.length && createdRounds?.length) {
        await supabase.from("round_presence").insert(
          createdRounds.flatMap((round) => members.map((member) => ({
            round_id: round.id,
            user_id: member.user_id,
            status: "pending",
            marked_by: user.id
          })))
        );
      }
    }
    revalidatePath(`/peladas/${input.pelada_id}/rodadas`);
    return { ok: true, message: input.recurrence_enabled && !roundId ? "Rodadas criadas" : "Rodada salva" };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteScheduledRoundsAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  try {
    const peladaId = z.string().uuid("Pelada inválida").parse(formData.get("pelada_id"));
    const roundIds = z.array(z.string().uuid("Rodada inválida")).min(1, "Selecione ao menos uma rodada.")
      .parse(formData.getAll("round_ids").map(String));

    const { data: membership, error: membershipError } = await supabase
      .from("pelada_members")
      .select("role")
      .eq("pelada_id", peladaId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) throw membershipError;
    if (membership?.role !== "owner" && membership?.role !== "admin") {
      throw new Error("Você não tem permissão para remover rodadas.");
    }

    const { data: selectedRounds, error: selectedRoundsError } = await supabase
      .from("rounds")
      .select("id, round_date, starts_at, duration_minutes, status")
      .eq("pelada_id", peladaId)
      .in("id", roundIds);

    if (selectedRoundsError) throw selectedRoundsError;
    if (!selectedRounds?.length) throw new Error("Nenhuma rodada encontrada.");

    const invalidRounds = selectedRounds.filter((round) => getRoundOperationalStatus(round) !== "scheduled");
    if (invalidRounds.length) {
      throw new Error("Apenas rodadas agendadas podem ser removidas por esta ação.");
    }

    const { error } = await supabase
      .from("rounds")
      .delete()
      .eq("pelada_id", peladaId)
      .in("id", roundIds)
      .eq("status", "active");

    if (error) throw error;
    revalidatePath(`/peladas/${peladaId}/rodadas`);
    revalidatePath(`/peladas/${peladaId}`);
    return { ok: true, message: `${selectedRounds.length} rodada(s) removida(s).` };
  } catch (error) {
    return actionError(error);
  }
}

export async function updatePresenceAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  try {
    const input = presenceSchema.parse(values(formData));
    const row = {
      ...input,
      marked_by: user.id,
      updated_at: new Date().toISOString()
    };

    const { data: updatedRows, error: updateError } = await supabase
      .from("round_presence")
      .update(row)
      .eq("round_id", input.round_id)
      .eq("user_id", input.user_id)
      .select("round_id");

    if (updateError) throw updateError;

    if (!updatedRows?.length) {
      const { error: insertError } = await supabase.from("round_presence").insert(row);
      if (insertError) throw insertError;
    }

    revalidatePath(`/rodadas/${input.round_id}`);
    return { ok: true, message: "Presença atualizada", status: input.status, user_id: input.user_id };
  } catch (error) {
    return actionError(error);
  }
}

export async function updatePresenceFormAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const input = presenceSchema.parse(values(formData));
  const row = {
    ...input,
    marked_by: user.id,
    updated_at: new Date().toISOString()
  };

  const { data: updatedRows, error: updateError } = await supabase
    .from("round_presence")
    .update(row)
    .eq("round_id", input.round_id)
    .eq("user_id", input.user_id)
    .select("round_id");

  if (updateError) throw new Error(updateError.message);

  if (!updatedRows?.length) {
    const { error: insertError } = await supabase.from("round_presence").insert(row);
    if (insertError) throw new Error(insertError.message);
  }

  revalidatePath(`/rodadas/${input.round_id}`);
  redirect(`/rodadas/${input.round_id}`);
}

export async function saveDrawAction(payload: unknown) {
  await requireUser();
  const supabase = await createClient();
  try {
    const input = drawSchema.parse(payload);
    await supabase.from("round_teams").delete().eq("round_id", input.round_id);
    for (const [index, team] of input.teams.entries()) {
      const { data, error } = await supabase
        .from("round_teams")
        .insert({ round_id: input.round_id, name: team.name, sort_order: index + 1 })
        .select("id")
        .single();
      if (error) throw error;
      if (team.players.length) {
        const { error: playersError } = await supabase.from("round_team_players").insert(
          team.players.map((userId) => ({ team_id: data.id, user_id: userId }))
        );
        if (playersError) throw playersError;
      }
    }
    revalidatePath(`/rodadas/${input.round_id}`);
    return { ok: true, message: "Sorteio salvo" };
  } catch (error) {
    return actionError(error);
  }
}

export async function createRoundMatchAction(_: unknown, formData: FormData) {
  await requireUser();
  const supabase = await createClient();
  try {
    const input = roundMatchSchema.parse(values(formData));
    const { error } = await supabase.from("round_matches").insert(input);
    if (error) throw error;
    revalidatePath(`/rodadas/${input.round_id}`);
    return { ok: true, message: "Partida registrada" };
  } catch (error) {
    return actionError(error);
  }
}

export async function createRoundMatchWithStatsAction(payload: unknown) {
  await requireUser();
  const supabase = await createClient();
  try {
    const input = roundMatchWithStatsSchema.parse(payload);
    const teamAStats = input.stats.filter((item) => item.side === "a");
    const teamBStats = input.stats.filter((item) => item.side === "b");
    const teamAScore =
      teamAStats.reduce((sum, item) => sum + item.goals_for, 0) +
      teamBStats.reduce((sum, item) => sum + item.own_goals, 0);
    const teamBScore =
      teamBStats.reduce((sum, item) => sum + item.goals_for, 0) +
      teamAStats.reduce((sum, item) => sum + item.own_goals, 0);

    const { data: match, error } = await supabase
      .from("round_matches")
      .insert({
        round_id: input.round_id,
        team_a_id: input.team_a_id,
        team_b_id: input.team_b_id,
        team_a_score: teamAScore,
        team_b_score: teamBScore,
        notes: input.notes
      })
      .select("id")
      .single();
    if (error) throw error;

    const statRows = input.stats
      .filter((item) => item.goals_for > 0 || item.own_goals > 0)
      .map((item) => ({
        match_id: match.id,
        user_id: item.user_id,
        team_id: item.team_id,
        goals_for: item.goals_for,
        own_goals: item.own_goals
      }));

    if (statRows.length) {
      const { error: statsError } = await supabase.from("round_match_player_stats").insert(statRows);
      if (statsError) throw statsError;
    }

    revalidatePath(`/rodadas/${input.round_id}`);
    return { ok: true, message: `Partida registrada: ${teamAScore} x ${teamBScore}` };
  } catch (error) {
    return actionError(error);
  }
}

export async function createFinancialEntryAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  try {
    const input = financialEntrySchema.parse(values(formData));
    const { error } = await supabase.from("financial_entries").insert({ ...input, created_by: user.id });
    if (error) throw error;
    revalidatePath(`/peladas/${input.pelada_id}/financeiro`);
    return { ok: true, message: "Lançamento salvo" };
  } catch (error) {
    return actionError(error);
  }
}

export async function createChargeAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  try {
    const input = chargeSchema.parse(values(formData));
    const { error } = await supabase.from("player_charges").insert({ ...input, created_by: user.id });
    if (error) throw error;
    revalidatePath(`/peladas/${input.pelada_id}/financeiro`);
    return { ok: true, message: "Cobrança criada" };
  } catch (error) {
    return actionError(error);
  }
}

export async function createBulkChargesAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  try {
    const input = bulkChargeSchema.parse(values(formData));
    const userIds = formData.getAll("user_ids").map(String).filter(Boolean);
    if (!userIds.length) throw new Error("Selecione ao menos um mensalista.");

    const { data: allowedMembers, error: membersError } = await supabase
      .from("pelada_members")
      .select("user_id")
      .eq("pelada_id", input.pelada_id)
      .eq("member_type", "monthly")
      .in("user_id", userIds);

    if (membersError) throw membersError;

    const allowedUserIds = allowedMembers?.map((member: any) => member.user_id) ?? [];
    if (!allowedUserIds.length) throw new Error("As cobranças em lote só podem ser geradas para mensalistas.");

    const competence = `${input.competence_year}-${input.competence_month}`;
    const rows = allowedUserIds.map((userId) => ({
      pelada_id: input.pelada_id,
      user_id: userId,
      description: input.description,
      competence,
      due_date: input.due_date,
      amount: input.amount,
      pix_code: input.pix_code,
      created_by: user.id
    }));

    const { error } = await supabase.from("player_charges").insert(rows);
    if (error) throw error;
    revalidatePath(`/peladas/${input.pelada_id}/financeiro`);
    revalidatePath("/dashboard");
    revalidateAppShell();
    return { ok: true, message: `${rows.length} cobrança(s) criada(s)` };
  } catch (error) {
    return actionError(error);
  }
}

export async function createPaymentAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  try {
    const input = paymentSchema.parse(values(formData));
    const { error } = await supabase.from("player_payments").insert({ ...input, created_by: user.id, status: "approved" });
    if (error) throw error;
    if (input.charge_id) {
      await supabase.from("player_charges").update({ status: "paid" }).eq("id", input.charge_id);
    }
    revalidatePath(`/peladas/${input.pelada_id}/financeiro`);
    return { ok: true, message: "Pagamento registrado" };
  } catch (error) {
    return actionError(error);
  }
}

export async function submitPlayerPaymentAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  try {
    const input = playerPaymentSchema.parse(values(formData));
    const { data: charge, error: chargeError } = await supabase
      .from("player_charges")
      .select("id, pelada_id, user_id")
      .eq("id", input.charge_id)
      .eq("user_id", user.id)
      .single();
    if (chargeError) throw chargeError;

    let proofUrl: string | undefined;
    const proof = formData.get("proof");
    if (proof instanceof File && proof.size > 0) {
      const safeName = proof.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${user.id}/${input.charge_id}-${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(path, proof, {
        upsert: false
      });
      if (uploadError) throw uploadError;
      proofUrl = path;
    }

    const { error } = await supabase.from("player_payments").insert({
      charge_id: input.charge_id,
      pelada_id: charge.pelada_id,
      user_id: user.id,
      amount: input.amount,
      paid_at: input.paid_at,
      notes: input.notes,
      proof_url: proofUrl,
      status: "pending",
      created_by: user.id
    });
    if (error) throw error;

    revalidatePath("/dashboard");
    revalidatePath(`/peladas/${charge.pelada_id}/financeiro`);
    revalidateAppShell();
    return { ok: true, message: "Pagamento enviado para aprovação" };
  } catch (error) {
    return actionError(error);
  }
}

export async function reviewPaymentAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  try {
    const input = reviewPaymentSchema.parse(values(formData));
    const { data: payment, error: paymentError } = await supabase
      .from("player_payments")
      .select("id, charge_id")
      .eq("id", input.payment_id)
      .single();
    if (paymentError) throw paymentError;

    const { error } = await supabase
      .from("player_payments")
      .update({
        status: input.status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: input.status === "rejected" ? input.rejection_reason : null
      })
      .eq("id", input.payment_id);
    if (error) throw error;

    if (input.status === "approved" && payment.charge_id) {
      await supabase.from("player_charges").update({ status: "paid" }).eq("id", payment.charge_id);
    }

    revalidatePath(`/peladas/${input.pelada_id}/financeiro`);
    revalidatePath("/dashboard");
    revalidateAppShell();
    return { ok: true, message: input.status === "approved" ? "Pagamento aprovado" : "Pagamento rejeitado" };
  } catch (error) {
    return actionError(error);
  }
}

export async function reviewPaymentFormAction(formData: FormData) {
  await reviewPaymentAction(null, formData);
}

export async function cancelChargeAction(formData: FormData) {
  await requireUser();
  const supabase = await createClient();
  const input = cancelChargeSchema.parse(values(formData));

  const { error } = await supabase
    .from("player_charges")
    .update({ status: "cancelled" })
    .eq("id", input.charge_id)
    .eq("pelada_id", input.pelada_id)
    .neq("status", "cancelled");

  if (error) throw new Error(error.message);

  revalidatePath(`/peladas/${input.pelada_id}/financeiro`);
  revalidatePath("/dashboard");
  revalidateAppShell();
}

export async function cancelPaymentAction(formData: FormData) {
  await requireUser();
  const supabase = await createClient();
  const input = cancelPaymentSchema.parse(values(formData));

  const { data: payment, error: paymentError } = await supabase
    .from("player_payments")
    .select("id, charge_id")
    .eq("id", input.payment_id)
    .eq("pelada_id", input.pelada_id)
    .single();

  if (paymentError) throw new Error(paymentError.message);

  const { error: deleteError } = await supabase
    .from("player_payments")
    .delete()
    .eq("id", input.payment_id)
    .eq("pelada_id", input.pelada_id);

  if (deleteError) throw new Error(deleteError.message);

  if (payment.charge_id) {
    const { data: approvedPayments, error: approvedPaymentsError } = await supabase
      .from("player_payments")
      .select("id")
      .eq("charge_id", payment.charge_id)
      .eq("status", "approved")
      .limit(1);

    if (approvedPaymentsError) throw new Error(approvedPaymentsError.message);

    if (!approvedPayments?.length) {
      const { error: chargeUpdateError } = await supabase
        .from("player_charges")
        .update({ status: "open" })
        .eq("id", payment.charge_id);

      if (chargeUpdateError) throw new Error(chargeUpdateError.message);
    }
  }

  revalidatePath(`/peladas/${input.pelada_id}/financeiro`);
  revalidatePath("/dashboard");
  revalidateAppShell();
}

export async function updateUserLocationAction(payload: unknown) {
  const user = await requireUser();
  const supabase = await createClient();

  try {
    const input = userLocationSchema.parse(payload);
    const { error } = await supabase
      .from("profiles")
      .update({
        last_lat: input.lat,
        last_lng: input.lng,
        last_location_label: input.label || null,
        last_location_source: input.source,
        last_location_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (error) throw error;
    revalidatePath("/explorar");
    return { ok: true, message: "Localização atualizada" };
  } catch (error) {
    return actionError(error);
  }
}

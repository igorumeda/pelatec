"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
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
  verifySignupCodeSchema
} from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

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
  if (error instanceof Error) return { ok: false, message: error.message };
  if (typeof error === "object" && error !== null && "message" in error) {
    return { ok: false, message: String(error.message) };
  }
  return { ok: false, message: "Não foi possível concluir a operação" };
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
    const { data, error } = await supabase.auth.verifyOtp({
      email: input.email,
      token: input.token,
      type: "email"
    });
    if (error) throw error;

    if (data.user) {
      const fallbackName = typeof data.user.user_metadata?.name === "string" && data.user.user_metadata.name.trim()
        ? data.user.user_metadata.name
        : data.user.email?.split("@")[0] ?? "Jogador";

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        name: fallbackName,
        email: data.user.email ?? ""
      });

      if (profileError) throw profileError;
    }
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
  redirect("/dashboard");
}

export async function updateProfileAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  try {
    const input = profileSchema.parse(values(formData));
    const { error } = await supabase.from("profiles").update(input).eq("id", user.id);
    if (error) throw error;
    revalidatePath("/perfil");
    return { ok: true, message: "Perfil atualizado" };
  } catch (error) {
    return actionError(error);
  }
}

export async function createPeladaAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const peladaId = crypto.randomUUID();
  try {
    const input = peladaSchema.parse(values(formData));
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Jogador",
        email: user.email ?? ""
      });
    if (profileError) throw profileError;

    const { error } = await supabase
      .from("peladas")
      .insert({ id: peladaId, ...input, created_by: user.id });
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
    const input = peladaSchema.parse(values(formData));
    const { error } = await supabase.from("peladas").update(input).eq("id", id);
    if (error) throw error;
    revalidatePath(`/peladas/${id}`);
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

export async function upsertRoundAction(roundId: string | null, _: unknown, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  try {
    const input = roundSchema.parse(values(formData));
    if (roundId) {
      const { error } = await supabase.from("rounds").update(input).eq("id", roundId);
      if (error) throw error;
    } else {
      const { data: round, error } = await supabase
        .from("rounds")
        .insert({ ...input, created_by: user.id })
        .select("id")
        .single();
      if (error) throw error;
      const { data: members } = await supabase
        .from("pelada_members")
        .select("user_id")
        .eq("pelada_id", input.pelada_id);
      if (members?.length) {
        await supabase.from("round_presence").insert(
          members.map((member) => ({
            round_id: round.id,
            user_id: member.user_id,
            status: "pending",
            marked_by: user.id
          }))
        );
      }
    }
    revalidatePath(`/peladas/${input.pelada_id}/rodadas`);
    return { ok: true, message: "Rodada salva" };
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

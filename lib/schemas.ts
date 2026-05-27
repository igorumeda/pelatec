import { z } from "zod";

const money = z.coerce.number().min(0).optional().or(z.literal("").transform(() => undefined));
const optionalText = z.string().trim().optional().transform((v) => v || undefined);

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Informe ao menos 6 caracteres")
});

export const signupSchema = loginSchema.extend({
  name: z.string().trim().min(2, "Informe seu nome")
}).omit({ password: true });

export const verifySignupCodeSchema = z.object({
  email: z.string().email("E-mail invÃ¡lido"),
  token: z.string().trim().min(6, "Informe o codigo enviado por e-mail")
});

export const passwordRecoverySchema = z.object({
  email: z.string().email("E-mail inválido")
});

export const passwordUpdateSchema = z.object({
  password: z.string().min(6, "Informe ao menos 6 caracteres")
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome"),
  phone: optionalText,
  avatar_url: optionalText
});

export const peladaSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da pelada"),
  description: optionalText,
  city: optionalText,
  neighborhood: optionalText,
  venue: optionalText,
  preferred_weekdays: optionalText,
  default_time: optionalText,
  monthly_fee: money,
  daily_fee: money,
  status: z.enum(["active", "inactive"]).default("active")
});

export const memberSchema = z.object({
  pelada_id: z.string().uuid(),
  email: z.string().email("Informe o e-mail do jogador"),
  role: z.enum(["admin", "player"]).default("player")
});

export const memberRoleSchema = z.object({
  pelada_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(["admin", "player"])
});

export const roundSchema = z.object({
  pelada_id: z.string().uuid(),
  title: optionalText,
  round_date: z.string().min(1, "Informe a data"),
  starts_at: z.string().min(1, "Informe o horário"),
  venue: optionalText,
  player_limit: z.coerce.number().int().positive().optional().or(z.literal("").transform(() => undefined)),
  notes: optionalText,
  status: z.enum(["scheduled", "finished", "cancelled"]).default("scheduled")
});

export const presenceSchema = z.object({
  round_id: z.string().uuid(),
  user_id: z.string().uuid(),
  status: z.enum(["confirmed", "declined", "pending"])
});

export const drawSchema = z.object({
  round_id: z.string().uuid(),
  teams: z.array(z.object({
    name: z.string().min(1),
    players: z.array(z.string().uuid())
  })).min(2)
});

export const roundMatchSchema = z.object({
  round_id: z.string().uuid(),
  team_a_id: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  team_b_id: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  team_a_score: z.coerce.number().int().min(0).optional().or(z.literal("").transform(() => undefined)),
  team_b_score: z.coerce.number().int().min(0).optional().or(z.literal("").transform(() => undefined)),
  notes: optionalText
});

export const roundMatchWithStatsSchema = z.object({
  round_id: z.string().uuid(),
  team_a_id: z.string().uuid(),
  team_b_id: z.string().uuid(),
  notes: optionalText,
  stats: z.array(z.object({
    user_id: z.string().uuid(),
    team_id: z.string().uuid(),
    side: z.enum(["a", "b"]),
    goals_for: z.coerce.number().int().min(0).default(0),
    own_goals: z.coerce.number().int().min(0).default(0)
  }))
});

export const financialEntrySchema = z.object({
  pelada_id: z.string().uuid(),
  type: z.enum(["revenue", "expense"]),
  description: z.string().trim().min(2),
  amount: z.coerce.number().min(0.01),
  entry_date: z.string().min(1),
  notes: optionalText
});

export const chargeSchema = z.object({
  pelada_id: z.string().uuid(),
  user_id: z.string().uuid(),
  round_id: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  description: z.string().trim().min(2),
  competence: optionalText,
  due_date: optionalText,
  amount: z.coerce.number().min(0.01),
  pix_code: optionalText
});

export const bulkChargeSchema = z.object({
  pelada_id: z.string().uuid(),
  description: z.string().trim().min(2),
  competence_year: z.string().regex(/^\d{4}$/),
  competence_month: z.string().regex(/^\d{2}$/),
  due_date: optionalText,
  amount: z.coerce.number().min(0.01),
  pix_code: optionalText
});

export const paymentSchema = z.object({
  pelada_id: z.string().uuid(),
  user_id: z.string().uuid(),
  charge_id: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  amount: z.coerce.number().min(0.01),
  paid_at: z.string().min(1),
  notes: optionalText,
  proof_url: optionalText
});

export const playerPaymentSchema = z.object({
  charge_id: z.string().uuid(),
  amount: z.coerce.number().min(0.01),
  paid_at: z.string().min(1),
  notes: optionalText
});

export const reviewPaymentSchema = z.object({
  payment_id: z.string().uuid(),
  pelada_id: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  rejection_reason: optionalText
});

export const cancelChargeSchema = z.object({
  charge_id: z.string().uuid(),
  pelada_id: z.string().uuid()
});

export const cancelPaymentSchema = z.object({
  payment_id: z.string().uuid(),
  pelada_id: z.string().uuid()
});

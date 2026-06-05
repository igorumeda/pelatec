import { z } from "zod";

const money = z.coerce.number().min(0, "Informe um valor válido").optional().or(z.literal("").transform(() => undefined));
const optionalText = z.string().trim().optional().transform((v) => v || undefined);
const optionalSlug = z.string().trim().toLowerCase().optional().transform((v) => v || undefined);
const optionalLatitude = z.coerce.number().min(-90).max(90).optional().or(z.literal("").transform(() => undefined));
const optionalLongitude = z.coerce.number().min(-180).max(180).optional().or(z.literal("").transform(() => undefined));
const optionalInteger = (min: number, max: number, message: string) =>
  z.coerce.number().int(message).min(min, message).max(max, message).optional().or(z.literal("").transform(() => undefined));

const reservedUsernames = new Set([
  "login",
  "signup",
  "dashboard",
  "peladas",
  "perfil",
  "rodadas",
  "auth",
  "api",
  "criar-senha",
  "atualizar-senha",
  "recuperar-senha"
]);

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Informe ao menos 6 caracteres")
});

export const signupSchema = loginSchema.extend({
  name: z.string().trim().min(2, "Informe seu nome")
}).omit({ password: true });

export const verifySignupCodeSchema = z.object({
  email: z.string().email("E-mail inválido"),
  token: z.string().trim().min(6, "Informe o código enviado por e-mail")
});

export const passwordRecoverySchema = z.object({
  email: z.string().email("E-mail inválido")
});

export const passwordUpdateSchema = z.object({
  password: z.string().min(6, "Informe ao menos 6 caracteres")
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome"),
  username: z.string().trim().toLowerCase()
    .regex(/^[a-z0-9_]{3,20}$/, "Use 3 a 20 caracteres minúsculos, números ou underscore")
    .refine((value) => !reservedUsernames.has(value), "Esse nome de usuário não está disponível"),
  nickname: optionalText,
  phone: optionalText,
  avatar_url: optionalText,
  age: optionalInteger(10, 99, "Informe uma idade válida"),
  position: z.enum(["striker", "midfielder", "fullback", "center_back", "goalkeeper"]).optional().or(z.literal("").transform(() => undefined)),
  height_cm: optionalInteger(120, 240, "Informe uma altura válida"),
  weight_kg: optionalInteger(35, 200, "Informe um peso válido"),
  play_style: optionalText,
  player_description: z.string().trim().max(600, "A descrição pode ter no máximo 600 caracteres").optional().transform((v) => v || undefined),
  shooting: z.coerce.number().int("Informe um número inteiro").min(0, "O valor mínimo é 0").max(10, "O valor máximo é 10"),
  dribbling: z.coerce.number().int("Informe um número inteiro").min(0, "O valor mínimo é 0").max(10, "O valor máximo é 10"),
  passing: z.coerce.number().int("Informe um número inteiro").min(0, "O valor mínimo é 0").max(10, "O valor máximo é 10"),
  strength: z.coerce.number().int("Informe um número inteiro").min(0, "O valor mínimo é 0").max(10, "O valor máximo é 10"),
  speed: z.coerce.number().int("Informe um número inteiro").min(0, "O valor mínimo é 0").max(10, "O valor máximo é 10"),
  defense: z.coerce.number().int("Informe um número inteiro").min(0, "O valor mínimo é 0").max(10, "O valor máximo é 10")
}).superRefine((value, ctx) => {
  const total = value.shooting + value.dribbling + value.passing + value.strength + value.speed + value.defense;
  if (total > 10) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Você pode distribuir no máximo 10 pontos entre as habilidades."
    });
  }
});

export const peladaSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da pelada"),
  description: optionalText,
  city: optionalText,
  neighborhood: optionalText,
  venue: optionalText,
  venue_address: optionalText,
  venue_place_id: optionalText,
  venue_lat: optionalLatitude,
  venue_lng: optionalLongitude,
  preferred_weekdays: optionalText,
  default_time: optionalText,
  monthly_fee: money,
  daily_fee: money,
  crest_url: optionalText,
  banner_url: optionalText,
  is_public: z.preprocess((value) => value === "on" || value === "true" || value === true, z.boolean()).default(false),
  public_slug: optionalSlug.pipe(
    z.string().regex(/^[a-z0-9-]{3,40}$/, "Use 3 a 40 caracteres minúsculos, números ou hífen").optional()
  ),
  status: z.enum(["active", "inactive"]).default("active")
}).superRefine((value, ctx) => {
  if (value.is_public && !value.public_slug) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["public_slug"],
      message: "Informe a URL pública da pelada."
    });
  }
});

export const memberSchema = z.object({
  pelada_id: z.string().uuid("Pelada inválida"),
  email: z.string().email("Informe o e-mail do jogador"),
  role: z.enum(["admin", "player"]).default("player"),
  member_type: z.enum(["monthly", "daily"]).default("monthly")
});

export const memberRoleSchema = z.object({
  pelada_id: z.string().uuid("Pelada inválida"),
  user_id: z.string().uuid("Usuário inválido"),
  role: z.enum(["admin", "player"]),
  member_type: z.enum(["monthly", "daily"]).default("monthly")
});

export const roundSchema = z.object({
  pelada_id: z.string().uuid("Pelada inválida"),
  title: optionalText,
  round_date: z.string().min(1, "Informe a data"),
  starts_at: z.string().min(1, "Informe o horário"),
  venue: optionalText,
  player_limit: z.coerce.number().int("Informe um número inteiro").positive("Informe um limite maior que zero").optional().or(z.literal("").transform(() => undefined)),
  notes: optionalText,
  status: z.enum(["scheduled", "finished", "cancelled"]).default("scheduled")
});

export const presenceSchema = z.object({
  round_id: z.string().uuid("Rodada inválida"),
  user_id: z.string().uuid("Usuário inválido"),
  status: z.enum(["confirmed", "declined", "pending"])
});

export const drawSchema = z.object({
  round_id: z.string().uuid("Rodada inválida"),
  teams: z.array(z.object({
    name: z.string().min(1, "Informe o nome do time"),
    players: z.array(z.string().uuid("Jogador inválido"))
  })).min(2, "Informe ao menos 2 times")
});

export const roundMatchSchema = z.object({
  round_id: z.string().uuid("Rodada inválida"),
  team_a_id: z.string().uuid("Time inválido").optional().or(z.literal("").transform(() => undefined)),
  team_b_id: z.string().uuid("Time inválido").optional().or(z.literal("").transform(() => undefined)),
  team_a_score: z.coerce.number().int("Informe um número inteiro").min(0, "O placar não pode ser negativo").optional().or(z.literal("").transform(() => undefined)),
  team_b_score: z.coerce.number().int("Informe um número inteiro").min(0, "O placar não pode ser negativo").optional().or(z.literal("").transform(() => undefined)),
  notes: optionalText
});

export const roundMatchWithStatsSchema = z.object({
  round_id: z.string().uuid("Rodada inválida"),
  team_a_id: z.string().uuid("Time A inválido"),
  team_b_id: z.string().uuid("Time B inválido"),
  notes: optionalText,
  stats: z.array(z.object({
    user_id: z.string().uuid("Jogador inválido"),
    team_id: z.string().uuid("Time inválido"),
    side: z.enum(["a", "b"]),
    goals_for: z.coerce.number().int("Informe um número inteiro").min(0, "O valor não pode ser negativo").default(0),
    own_goals: z.coerce.number().int("Informe um número inteiro").min(0, "O valor não pode ser negativo").default(0)
  }))
});

export const financialEntrySchema = z.object({
  pelada_id: z.string().uuid("Pelada inválida"),
  type: z.enum(["revenue", "expense"]),
  description: z.string().trim().min(2, "Informe a descrição"),
  amount: z.coerce.number().min(0.01, "Informe um valor maior que zero"),
  entry_date: z.string().min(1, "Informe a data"),
  notes: optionalText
});

export const chargeSchema = z.object({
  pelada_id: z.string().uuid("Pelada inválida"),
  user_id: z.string().uuid("Jogador inválido"),
  round_id: z.string().uuid("Rodada inválida").optional().or(z.literal("").transform(() => undefined)),
  description: z.string().trim().min(2, "Informe a descrição"),
  competence: optionalText,
  due_date: optionalText,
  amount: z.coerce.number().min(0.01, "Informe um valor maior que zero"),
  pix_code: optionalText
});

export const bulkChargeSchema = z.object({
  pelada_id: z.string().uuid("Pelada inválida"),
  description: z.string().trim().min(2, "Informe a descrição"),
  competence_year: z.string().regex(/^\d{4}$/, "Informe o ano da competência"),
  competence_month: z.string().regex(/^\d{2}$/, "Informe o mês da competência"),
  due_date: optionalText,
  amount: z.coerce.number().min(0.01, "Informe um valor maior que zero"),
  pix_code: optionalText
});

export const paymentSchema = z.object({
  pelada_id: z.string().uuid("Pelada inválida"),
  user_id: z.string().uuid("Jogador inválido"),
  charge_id: z.string().uuid("Cobrança inválida").optional().or(z.literal("").transform(() => undefined)),
  amount: z.coerce.number().min(0.01, "Informe um valor maior que zero"),
  paid_at: z.string().min(1, "Informe a data do pagamento"),
  notes: optionalText,
  proof_url: optionalText
});

export const playerPaymentSchema = z.object({
  charge_id: z.string().uuid("Cobrança inválida"),
  amount: z.coerce.number().min(0.01, "Informe um valor maior que zero"),
  paid_at: z.string().min(1, "Informe a data do pagamento"),
  notes: optionalText
});

export const reviewPaymentSchema = z.object({
  payment_id: z.string().uuid("Pagamento inválido"),
  pelada_id: z.string().uuid("Pelada inválida"),
  status: z.enum(["approved", "rejected"]),
  rejection_reason: optionalText
});

export const cancelChargeSchema = z.object({
  charge_id: z.string().uuid("Cobrança inválida"),
  pelada_id: z.string().uuid("Pelada inválida")
});

export const cancelPaymentSchema = z.object({
  payment_id: z.string().uuid("Pagamento inválido"),
  pelada_id: z.string().uuid("Pelada inválida")
});

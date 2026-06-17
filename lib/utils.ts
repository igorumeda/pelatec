import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function brl(value: number | string | null | undefined) {
  const numberValue = Number(value ?? 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(numberValue);
}

export function dateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

export function competenceLabel(value: string | null | undefined) {
  if (!value) return "Sem competência";
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return value;

  const [, year, month] = match;
  const date = new Date(Number(year), Number(month) - 1, 1);
  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(date);
  return `${monthLabel.charAt(0).toUpperCase()}${monthLabel.slice(1)}/${year}`;
}

export function memberRoleLabel(value: string | null | undefined) {
  switch (value) {
    case "owner":
      return "Dono";
    case "admin":
      return "Administrador";
    case "player":
      return "Jogador";
    default:
      return value ?? "-";
  }
}

export function memberTypeLabel(value: string | null | undefined) {
  switch (value) {
    case "monthly":
      return "Mensalista";
    case "daily":
      return "Diarista";
    default:
      return value ?? "-";
  }
}

export function playerPositionLabel(value: string | null | undefined) {
  switch (value) {
    case "striker":
      return "Atacante";
    case "midfielder":
      return "Meia";
    case "fullback":
      return "Lateral";
    case "center_back":
      return "Zagueiro";
    case "goalkeeper":
      return "Goleiro";
    default:
      return value ?? "-";
  }
}

export function totalSkillPoints(skills: {
  shooting?: number | null;
  dribbling?: number | null;
  passing?: number | null;
  strength?: number | null;
  speed?: number | null;
  defense?: number | null;
}) {
  return Number(skills.shooting ?? 0) +
    Number(skills.dribbling ?? 0) +
    Number(skills.passing ?? 0) +
    Number(skills.strength ?? 0) +
    Number(skills.speed ?? 0) +
    Number(skills.defense ?? 0);
}

export function roundStatusLabel(value: string | null | undefined) {
  switch (value) {
    case "active":
      return "Ativa";
    case "scheduled":
      return "Agendada";
    case "in_progress":
      return "Em andamento";
    case "finished":
      return "Encerrada";
    case "cancelled":
      return "Cancelada";
    default:
      return value ?? "-";
  }
}

export type RoundOperationalStatus = "scheduled" | "in_progress" | "finished" | "cancelled";

export function getRoundOperationalStatus(round: {
  round_date: string;
  starts_at: string;
  duration_minutes?: number | string | null;
  status?: string | null;
}, now = new Date()): RoundOperationalStatus {
  if (round.status === "cancelled") return "cancelled";

  const startsAt = new Date(`${round.round_date}T${String(round.starts_at).slice(0, 8)}`);
  const durationMinutes = Math.max(1, Number(round.duration_minutes ?? 120));
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);

  if (now < startsAt) return "scheduled";
  if (now <= endsAt) return "in_progress";
  return "finished";
}

export function chargeStatusLabel(value: string | null | undefined) {
  switch (value) {
    case "open":
      return "Aberta";
    case "paid":
      return "Paga";
    case "cancelled":
      return "Cancelada";
    default:
      return value ?? "-";
  }
}

export function peladaStatusLabel(value: string | null | undefined) {
  switch (value) {
    case "active":
      return "Ativa";
    case "inactive":
      return "Inativa";
    default:
      return value ?? "-";
  }
}

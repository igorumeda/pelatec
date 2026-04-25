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
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

export function competenceLabel(value: string | null | undefined) {
  if (!value) return "Sem competencia";
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

export function roundStatusLabel(value: string | null | undefined) {
  switch (value) {
    case "scheduled":
      return "Agendada";
    case "finished":
      return "Encerrada";
    case "cancelled":
      return "Cancelada";
    default:
      return value ?? "-";
  }
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

export type MemberRole = "owner" | "admin" | "player";
export type PeladaStatus = "active" | "inactive";
export type RoundStatus = "scheduled" | "finished" | "cancelled";
export type PresenceStatus = "confirmed" | "declined" | "pending";
export type FinancialEntryType = "revenue" | "expense";
export type ChargeStatus = "open" | "paid" | "cancelled";

export type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Pelada = {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  neighborhood: string | null;
  venue: string | null;
  preferred_weekdays: string | null;
  default_time: string | null;
  monthly_fee: number | string | null;
  daily_fee: number | string | null;
  status: PeladaStatus;
  created_by: string;
  created_at: string;
};

export type PeladaMember = {
  pelada_id: string;
  user_id: string;
  role: MemberRole;
  profiles?: Profile | null;
};

export type Round = {
  id: string;
  pelada_id: string;
  title: string | null;
  round_date: string;
  starts_at: string;
  venue: string | null;
  player_limit: number | null;
  notes: string | null;
  status: RoundStatus;
  created_by: string;
  created_at: string;
};

export type PresenceRow = {
  round_id: string;
  user_id: string;
  status: PresenceStatus;
  marked_by: string | null;
  profiles?: Profile | null;
};

export type RoundTeam = {
  id: string;
  round_id: string;
  name: string;
  sort_order: number;
  round_team_players?: { user_id: string; profiles?: Profile | null }[];
};

export type PersonKind = "cumple" | "aniversario";

export interface UserRow {
  id: string;
  name: string;
  pin_hash: string | null;
  alias: string;
  is_admin: boolean;
  is_guest: boolean;
  collector_id: string | null;
  created_at: string;
}

export interface PrefsRow {
  user_id: string;
  notif_cumple: boolean;
  notif_gasto: boolean;
  notif_resumen: boolean;
  theme: "claro" | "oscuro";
}

export interface PersonRow {
  id: string;
  name: string;
  kind: PersonKind;
  month: number;
  day: number;
  year: number;
  user_id: string | null;
  added_by_id: string;
  is_private: boolean;
  remind: boolean;
}

export interface ExpenseRow {
  id: string;
  event_id: string;
  description: string;
  amount: number;
  payer_id: string;
  created_at: string;
  shares: string[];
}

export interface PaymentRow {
  id: string;
  event_id: string;
  from_id: string;
  to_id: string;
  amount: number;
  created_at: string;
}

export interface EventRow {
  id: string;
  name: string;
  created_by: string;
  closed: boolean;
  created_at: string;
  participants: string[];
  /** Cuotas per participant id (real or guest); missing id defaults to 1. */
  participantShares: Record<string, number>;
  expenses: ExpenseRow[];
  payments: PaymentRow[];
}

export interface AppState {
  me: UserRow;
  prefs: PrefsRow;
  users: UserRow[];
  people: PersonRow[];
  events: EventRow[];
  readNotifIds: string[];
}

export type PersonKind = "cumple" | "aniversario";

/**
 * A row in `users`. Covers both real accounts and temporary event guests
 * (`is_guest: true`) -- guests have no `pin_hash` and exist only to
 * participate in an event's balance; they're deleted when the event closes.
 */
export interface UserRow {
  id: string;
  name: string;
  pin_hash: string | null;
  alias: string;
  is_admin: boolean;
  is_guest: boolean;
  created_at: string;
}

/** One user's notification/theme settings (row in `prefs`, one per user). */
export interface PrefsRow {
  user_id: string;
  notif_cumple: boolean;
  notif_gasto: boolean;
  notif_resumen: boolean;
  theme: "claro" | "oscuro";
}

/** A birthday or anniversary entry. `user_id` is set once someone links it to their own account (see lib/auth "link candidate" flow). */
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

/** A shared expense inside an event. `shares` lists who it's split between (real users and/or guests, by id). */
export interface ExpenseRow {
  id: string;
  event_id: string;
  description: string;
  amount: number;
  payer_id: string;
  created_at: string;
  shares: string[];
}

/** A recorded settle-up between two people within an event (see lib/actions/events markPaid/markReceived/settleWith). */
export interface PaymentRow {
  id: string;
  event_id: string;
  from_id: string;
  to_id: string;
  amount: number;
  created_at: string;
}

/** A shared-expense event (e.g. a trip) with its participants, expenses and settle-up payments already joined in. */
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

/** Everything a request needs about the current user and the group, fetched once via lib/data.getFullState. */
export interface AppState {
  me: UserRow;
  prefs: PrefsRow;
  users: UserRow[];
  people: PersonRow[];
  events: EventRow[];
  readNotifIds: string[];
}

import "server-only";
import { cache } from "react";
import { db } from "./supabase";
import type { AppState, EventRow, ExpenseRow, PaymentRow, PersonRow, PrefsRow, UserRow } from "./types";

/**
 * Fetches everything the app needs for one request in a handful of parallel
 * queries. Wrapped in React's cache() so the layout and the page it wraps
 * (which both need this) share one fetch per request instead of two.
 */
export const getFullState = cache(async function getFullState(meId: string): Promise<AppState> {
  const [usersQ, peopleQ, eventsQ, participantsQ, expensesQ, sharesQ, paymentsQ, prefsQ, readsQ] = await Promise.all([
    db.from("users").select("*").order("name"),
    db.from("people").select("*"),
    db.from("events").select("*").order("created_at", { ascending: false }),
    db.from("event_participants").select("event_id,user_id"),
    db.from("expenses").select("*").order("created_at"),
    db.from("expense_shares").select("expense_id,user_id"),
    db.from("payments").select("*"),
    db.from("prefs").select("*").eq("user_id", meId).maybeSingle(),
    db.from("notification_reads").select("notif_id").eq("user_id", meId),
  ]);

  for (const q of [usersQ, peopleQ, eventsQ, participantsQ, expensesQ, sharesQ, paymentsQ, prefsQ, readsQ]) {
    if (q.error) throw q.error;
  }

  const sharesByExpense = new Map<string, string[]>();
  (sharesQ.data || []).forEach((s) => {
    const arr = sharesByExpense.get(s.expense_id) || [];
    arr.push(s.user_id);
    sharesByExpense.set(s.expense_id, arr);
  });

  const expensesByEvent = new Map<string, ExpenseRow[]>();
  (expensesQ.data || []).forEach((x) => {
    const row: ExpenseRow = { ...x, amount: Number(x.amount), shares: sharesByExpense.get(x.id) || [] };
    const arr = expensesByEvent.get(x.event_id) || [];
    arr.push(row);
    expensesByEvent.set(x.event_id, arr);
  });

  const paymentsByEvent = new Map<string, PaymentRow[]>();
  (paymentsQ.data || []).forEach((p) => {
    const row: PaymentRow = { ...p, amount: Number(p.amount) };
    const arr = paymentsByEvent.get(p.event_id) || [];
    arr.push(row);
    paymentsByEvent.set(p.event_id, arr);
  });

  const participantsByEvent = new Map<string, string[]>();
  (participantsQ.data || []).forEach((pp) => {
    const arr = participantsByEvent.get(pp.event_id) || [];
    arr.push(pp.user_id);
    participantsByEvent.set(pp.event_id, arr);
  });

  const events: EventRow[] = (eventsQ.data || []).map((e) => ({
    ...e,
    participants: participantsByEvent.get(e.id) || [],
    expenses: expensesByEvent.get(e.id) || [],
    payments: paymentsByEvent.get(e.id) || [],
  }));

  const users = (usersQ.data || []) as UserRow[];
  const me = users.find((u) => u.id === meId);
  if (!me) throw new Error("Session user not found");

  const prefs: PrefsRow =
    (prefsQ.data as PrefsRow) || { user_id: meId, notif_cumple: true, notif_gasto: true, notif_resumen: false, theme: "claro" };

  return {
    me,
    prefs,
    users,
    people: (peopleQ.data || []) as PersonRow[],
    events,
    readNotifIds: (readsQ.data || []).map((r) => r.notif_id),
  };
});

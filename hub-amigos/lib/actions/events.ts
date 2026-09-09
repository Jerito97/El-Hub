"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { getFullState } from "@/lib/data";
import { settleFor } from "@/lib/domain";
import { money } from "@/lib/format";
import { sendPushToUsers } from "@/lib/push";

export interface ParticipantInput {
  id: string;
  shares: number;
}

export interface GuestInput {
  name: string;
  shares: number;
  collectorId: string;
}

function normShares(n: number) {
  return Number.isFinite(n) && n >= 1 ? Math.round(n) : 1;
}

/** Creates the temporary-guest user rows for a new/edited event, one at a time (so each row's id pairs unambiguously with its own shares/collector). */
async function insertGuests(eventId: string, guests: GuestInput[]) {
  for (const g of guests) {
    const name = g.name.trim();
    if (!name) continue;
    const { data: user, error } = await db.from("users").insert({ name, is_guest: true, alias: "", collector_id: g.collectorId }).select("id").single();
    if (error || !user) continue;
    await db.from("event_participants").insert({ event_id: eventId, user_id: user.id, shares: normShares(g.shares) });
  }
}

export async function saveEvent(name: string, participants: ParticipantInput[], guests: GuestInput[] = []): Promise<{ ok: boolean; error?: string; eventId?: string }> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Sesión vencida" };
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Ponele un nombre al evento" };

  const byId = new Map(participants.map((p) => [p.id, normShares(p.shares)]));
  if (!byId.has(me.id)) byId.set(me.id, 1);

  const { data: event, error } = await db.from("events").insert({ name: trimmed, created_by: me.id }).select("id").single();
  if (error || !event) return { ok: false, error: "No se pudo crear el evento." };

  await db.from("event_participants").insert(Array.from(byId, ([user_id, shares]) => ({ event_id: event.id, user_id, shares })));
  if (guests.length > 0) await insertGuests(event.id, guests);

  revalidatePath("/", "layout");
  return { ok: true, eventId: event.id };
}

/** Renames the event and syncs its real-participant list/cuotas (the creator can never be removed). New guests can be added here too; existing guests are managed from the event page. */
export async function editEvent(
  eventId: string,
  name: string,
  participants: ParticipantInput[],
  newGuests: GuestInput[] = []
): Promise<{ ok: boolean; error?: string }> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Sesión vencida" };
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Ponele un nombre al evento" };

  const { data: ev } = await db.from("events").select("created_by").eq("id", eventId).maybeSingle();
  if (!ev) return { ok: false, error: "Ese evento ya no existe." };

  const byId = new Map(participants.map((p) => [p.id, normShares(p.shares)]));
  if (!byId.has(ev.created_by as string)) byId.set(ev.created_by as string, 1);

  const { error } = await db.from("events").update({ name: trimmed }).eq("id", eventId);
  if (error) return { ok: false, error: "No se pudo guardar el evento." };

  const { data: current } = await db.from("event_participants").select("user_id,shares").eq("event_id", eventId);
  const currentIds = (current || []).map((p) => p.user_id as string);
  const { data: guestFlags } = currentIds.length ? await db.from("users").select("id,is_guest").in("id", currentIds) : { data: [] };
  const guestIdSet = new Set((guestFlags || []).filter((u) => u.is_guest).map((u) => u.id as string));

  // Guests are managed separately (updateGuest/removeGuest/insertGuests below) -- never diffed here.
  const currentById = new Map((current || []).filter((p) => !guestIdSet.has(p.user_id as string)).map((p) => [p.user_id as string, p.shares as number]));
  const toAdd = Array.from(byId, ([user_id, shares]) => ({ user_id, shares })).filter((p) => !currentById.has(p.user_id));
  const toUpdate = Array.from(byId, ([user_id, shares]) => ({ user_id, shares })).filter((p) => currentById.has(p.user_id) && currentById.get(p.user_id) !== p.shares);
  const toRemove = Array.from(currentById.keys()).filter((id) => !byId.has(id));

  if (toAdd.length) await db.from("event_participants").insert(toAdd.map((p) => ({ event_id: eventId, ...p })));
  await Promise.all(toUpdate.map((p) => db.from("event_participants").update({ shares: p.shares }).eq("event_id", eventId).eq("user_id", p.user_id)));
  if (toRemove.length) await db.from("event_participants").delete().eq("event_id", eventId).in("user_id", toRemove);
  if (newGuests.length > 0) await insertGuests(eventId, newGuests);

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Reassigns a guest's collector and/or changes their cuota. */
export async function updateGuest(guestId: string, patch: { shares?: number; collectorId?: string }): Promise<{ ok: boolean; error?: string }> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Sesión vencida" };

  const { data: guest } = await db.from("users").select("id,is_guest").eq("id", guestId).maybeSingle();
  if (!guest || !guest.is_guest) return { ok: false, error: "Ese invitado ya no existe." };

  if (patch.collectorId) {
    await db.from("users").update({ collector_id: patch.collectorId }).eq("id", guestId);
  }
  if (patch.shares) {
    const { data: rows } = await db.from("event_participants").select("event_id").eq("user_id", guestId);
    if (rows && rows.length > 0) {
      await db.from("event_participants").update({ shares: normShares(patch.shares) }).eq("user_id", guestId);
    }
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Removes a temporary guest early (before the event closes). */
export async function removeGuest(guestId: string): Promise<{ ok: boolean; error?: string }> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Sesión vencida" };

  const { data: guest } = await db.from("users").select("id,is_guest").eq("id", guestId).maybeSingle();
  if (!guest || !guest.is_guest) return { ok: false, error: "Ese invitado ya no existe." };

  const { error } = await db.from("users").delete().eq("id", guestId);
  if (error) return { ok: false, error: "No se pudo quitar al invitado." };
  revalidatePath("/", "layout");
  return { ok: true };
}

async function isGuest(userId: string): Promise<boolean> {
  const { data } = await db.from("users").select("is_guest").eq("id", userId).maybeSingle();
  return !!data?.is_guest;
}

export async function saveExpense(
  eventId: string,
  desc: string,
  amount: number,
  payerId: string,
  shareIds: string[]
): Promise<{ ok: boolean; error?: string }> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Sesión vencida" };
  const trimmed = desc.trim();
  if (!trimmed || !amount || amount <= 0 || !shareIds.length) return { ok: false, error: "Completá descripción, monto y participantes." };
  const finalPayerId = payerId || me.id;
  if (await isGuest(finalPayerId)) return { ok: false, error: "Un invitado no puede figurar como quien pagó." };

  const { data: expense, error } = await db
    .from("expenses")
    .insert({ event_id: eventId, description: trimmed, amount, payer_id: finalPayerId })
    .select("id")
    .single();
  if (error || !expense) return { ok: false, error: "No se pudo guardar el gasto." };

  await db.from("expense_shares").insert(shareIds.map((user_id) => ({ expense_id: expense.id, user_id })));
  revalidatePath("/", "layout");

  const [{ data: ev }, { data: participantRows }] = await Promise.all([
    db.from("events").select("name").eq("id", eventId).maybeSingle(),
    db.from("event_participants").select("user_id").eq("event_id", eventId),
  ]);
  const others = (participantRows || []).map((p) => p.user_id).filter((id) => id !== me.id);
  if (ev && others.length > 0) {
    const { data: prefsRows } = await db.from("prefs").select("user_id").in("user_id", others).eq("notif_gasto", true);
    const targets = (prefsRows || []).map((p) => p.user_id);
    if (targets.length > 0) {
      await sendPushToUsers(targets, { title: `Nuevo gasto en ${ev.name}`, body: `${trimmed} · ${money(amount)}`, url: `/gastos/${eventId}` });
    }
  }

  return { ok: true };
}

export async function editExpense(
  expenseId: string,
  desc: string,
  amount: number,
  payerId: string,
  shareIds: string[]
): Promise<{ ok: boolean; error?: string }> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Sesión vencida" };
  const trimmed = desc.trim();
  if (!trimmed || !amount || amount <= 0 || !shareIds.length) return { ok: false, error: "Completá descripción, monto y participantes." };
  const finalPayerId = payerId || me.id;
  if (await isGuest(finalPayerId)) return { ok: false, error: "Un invitado no puede figurar como quien pagó." };

  const { error } = await db.from("expenses").update({ description: trimmed, amount, payer_id: finalPayerId }).eq("id", expenseId);
  if (error) return { ok: false, error: "No se pudo guardar el gasto." };

  await db.from("expense_shares").delete().eq("expense_id", expenseId);
  await db.from("expense_shares").insert(shareIds.map((user_id) => ({ expense_id: expenseId, user_id })));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function closeEvent(eventId: string): Promise<{ ok: boolean; error?: string }> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Sesión vencida" };

  const state = await getFullState(me.id);
  const ev = state.events.find((e) => e.id === eventId);
  if (!ev || ev.created_by !== me.id) return { ok: false, error: "Solo quien creó el evento puede cerrarlo." };
  if (settleFor(ev, state.users).length > 0) return { ok: false, error: "No se puede cerrar con deudas sin saldar." };

  const { error } = await db.from("events").update({ closed: true }).eq("id", eventId);
  if (error) return { ok: false, error: "No se pudo cerrar el evento." };

  const guestIds = state.users.filter((u) => u.is_guest && ev.participants.includes(u.id)).map((u) => u.id);
  if (guestIds.length > 0) await db.from("users").delete().in("id", guestIds);

  revalidatePath("/", "layout");
  return { ok: true };
}

async function recordPayment(eventId: string, fromId: string, toId: string, amount: number) {
  return db.from("payments").insert({ event_id: eventId, from_id: fromId, to_id: toId, amount }).select("id").single();
}

/** "Ya se lo pagué" -- I paid someone in this event. */
export async function markPaid(eventId: string, toId: string, amount: number): Promise<{ ok: boolean; error?: string; paymentId?: string }> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Sesión vencida" };
  const { data, error } = await recordPayment(eventId, me.id, toId, amount);
  if (error || !data) return { ok: false, error: "No se pudo registrar el pago." };
  revalidatePath("/", "layout");
  return { ok: true, paymentId: data.id };
}

/** "Ya me pagó" -- someone paid me in this event. */
export async function markReceived(eventId: string, fromId: string, amount: number): Promise<{ ok: boolean; error?: string; paymentId?: string }> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Sesión vencida" };
  const { data, error } = await recordPayment(eventId, fromId, me.id, amount);
  if (error || !data) return { ok: false, error: "No se pudo registrar el cobro." };
  revalidatePath("/", "layout");
  return { ok: true, paymentId: data.id };
}

/** The inline "PAGADO" button on the consolidated balance tab -- settle in a specific direction. */
export async function settleWith(eventId: string, fromId: string, toId: string, amount: number): Promise<{ ok: boolean; error?: string; paymentId?: string }> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Sesión vencida" };
  const { data, error } = await recordPayment(eventId, fromId, toId, amount);
  if (error || !data) return { ok: false, error: "No se pudo registrar el pago." };
  revalidatePath("/", "layout");
  return { ok: true, paymentId: data.id };
}

export async function undoPaid(paymentId: string): Promise<{ ok: boolean; error?: string }> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Sesión vencida" };
  const { error } = await db.from("payments").delete().eq("id", paymentId);
  if (error) return { ok: false, error: "No se pudo deshacer." };
  revalidatePath("/", "layout");
  return { ok: true };
}

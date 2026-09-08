"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { getFullState } from "@/lib/data";
import { settleFor } from "@/lib/domain";

export async function saveEvent(name: string, participantIds: string[]): Promise<{ ok: boolean; error?: string; eventId?: string }> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Sesión vencida" };
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Ponele un nombre al evento" };

  const participants = Array.from(new Set([me.id, ...participantIds]));
  const { data: event, error } = await db.from("events").insert({ name: trimmed, created_by: me.id }).select("id").single();
  if (error || !event) return { ok: false, error: "No se pudo crear el evento." };

  await db.from("event_participants").insert(participants.map((user_id) => ({ event_id: event.id, user_id })));
  revalidatePath("/", "layout");
  return { ok: true, eventId: event.id };
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

  const { data: expense, error } = await db
    .from("expenses")
    .insert({ event_id: eventId, description: trimmed, amount, payer_id: payerId || me.id })
    .select("id")
    .single();
  if (error || !expense) return { ok: false, error: "No se pudo guardar el gasto." };

  await db.from("expense_shares").insert(shareIds.map((user_id) => ({ expense_id: expense.id, user_id })));
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

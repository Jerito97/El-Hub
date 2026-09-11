"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { getCurrentUser, hashPin, isValidPin } from "@/lib/auth";
import { getFullState } from "@/lib/data";
import { settleFor } from "@/lib/domain";
import { validateDate } from "@/lib/format";
import type { PersonInput } from "@/lib/actions/people";

/** Every action in this file is admin-only; bounces non-admins back to /home rather than returning a plain error. */
async function requireAdmin() {
  const me = await getCurrentUser();
  if (!me || !me.is_admin) redirect("/home");
  return me;
}

export async function adminResetPin(userId: string, newPin: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  if (!isValidPin(newPin.trim())) return { ok: false, error: "El PIN tiene que ser de 4 a 6 números." };

  const pin_hash = await hashPin(newPin.trim());
  const { error } = await db.from("users").update({ pin_hash }).eq("id", userId);
  if (error) return { ok: false, error: "No se pudo resetear el PIN." };
  revalidatePath("/admin");
  return { ok: true };
}

export async function adminDeleteUser(userId: string): Promise<{ ok: boolean; error?: string }> {
  const me = await requireAdmin();
  if (userId === me.id) return { ok: false, error: "No podés eliminar tu propia cuenta desde acá." };

  const { error } = await db.from("users").delete().eq("id", userId);
  if (error) return { ok: false, error: "No se pudo eliminar el usuario." };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function adminSavePersonEdit(personId: string, input: PersonInput): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const name = input.name.trim();
  const err = !name ? "Completá nombre y fecha" : validateDate(input.day, input.month, input.year, "Completá nombre y fecha");
  if (err) return { ok: false, error: err };

  const { error } = await db
    .from("people")
    .update({
      name,
      kind: input.kind,
      day: input.day,
      month: input.month,
      year: input.year,
      is_private: input.isPrivate,
      remind: input.remind,
    })
    .eq("id", personId);
  if (error) return { ok: false, error: "No se pudo guardar." };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function adminDeletePerson(personId: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const { error } = await db.from("people").delete().eq("id", personId);
  if (error) return { ok: false, error: "No se pudo borrar." };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function adminCloseEvent(eventId: string): Promise<{ ok: boolean; error?: string }> {
  const me = await requireAdmin();
  const state = await getFullState(me.id);
  const ev = state.events.find((e) => e.id === eventId);
  if (!ev) return { ok: false, error: "Ese evento ya no existe." };
  if (settleFor(ev, state.users).length > 0) return { ok: false, error: "No se puede cerrar con deudas sin saldar." };

  const { error } = await db.from("events").update({ closed: true }).eq("id", eventId);
  if (error) return { ok: false, error: "No se pudo cerrar el evento." };

  // Same guest cleanup as the user-facing closeEvent() in lib/actions/events.ts.
  const guestIds = state.users.filter((u) => u.is_guest && ev.participants.includes(u.id)).map((u) => u.id);
  if (guestIds.length > 0) await db.from("users").delete().in("id", guestIds);

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function adminReopenEvent(eventId: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const { error } = await db.from("events").update({ closed: false }).eq("id", eventId);
  if (error) return { ok: false, error: "No se pudo reabrir el evento." };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function adminDeleteEvent(eventId: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  // Guest ids must be captured before the event is deleted: deleting the
  // event cascades to event_participants, so afterwards there'd be no way
  // to tell which guests belonged to it.
  const { data: participantRows } = await db.from("event_participants").select("user_id").eq("event_id", eventId);
  const participantIds = (participantRows || []).map((p) => p.user_id);
  const { data: guestRows } = participantIds.length ? await db.from("users").select("id").in("id", participantIds).eq("is_guest", true) : { data: [] };

  const { error } = await db.from("events").delete().eq("id", eventId);
  if (error) return { ok: false, error: "No se pudo eliminar el evento." };

  const guestIds = (guestRows || []).map((u) => u.id);
  if (guestIds.length > 0) await db.from("users").delete().in("id", guestIds);

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function adminDeleteExpense(expenseId: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const { error } = await db.from("expenses").delete().eq("id", expenseId);
  if (error) return { ok: false, error: "No se pudo eliminar el gasto." };
  revalidatePath("/", "layout");
  return { ok: true };
}

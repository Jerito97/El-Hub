"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { getCurrentUser, hashPin } from "@/lib/auth";
import { getFullState } from "@/lib/data";
import { settleFor } from "@/lib/domain";
import type { PersonInput } from "@/lib/actions/people";

async function requireAdmin() {
  const me = await getCurrentUser();
  if (!me || !me.is_admin) redirect("/home");
  return me;
}

export async function adminResetPin(userId: string, newPin: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  if (!/^\d{4,6}$/.test(newPin.trim())) return { ok: false, error: "El PIN tiene que ser de 4 a 6 números." };

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
  if (!name || !input.day || !input.month || !input.year) return { ok: false, error: "Completá nombre y fecha" };
  if (input.day > new Date(input.year, input.month, 0).getDate()) return { ok: false, error: "Esa fecha no existe" };

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
  const { error } = await db.from("events").delete().eq("id", eventId);
  if (error) return { ok: false, error: "No se pudo eliminar el evento." };
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

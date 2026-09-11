"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { validateDate } from "@/lib/format";
import type { PersonKind } from "@/lib/types";

export interface PersonInput {
  name: string;
  kind: PersonKind;
  day: number;
  month: number;
  year: number;
  isPrivate: boolean;
  remind: boolean;
}

export async function savePerson(input: PersonInput): Promise<{ ok: boolean; error?: string }> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Sesión vencida" };
  const name = input.name.trim();
  const err = !name ? "Completá nombre y fecha" : validateDate(input.day, input.month, input.year, "Completá nombre y fecha");
  if (err) return { ok: false, error: err };

  const { error } = await db.from("people").insert({
    name,
    kind: input.kind,
    day: input.day,
    month: input.month,
    year: input.year,
    is_private: input.isPrivate,
    remind: input.remind,
    added_by_id: me.id,
  });
  if (error) return { ok: false, error: "No se pudo guardar." };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function savePersonEdit(personId: string, input: PersonInput): Promise<{ ok: boolean; error?: string }> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Sesión vencida" };
  const name = input.name.trim();
  const err = !name ? "Completá nombre y fecha" : validateDate(input.day, input.month, input.year, "Completá nombre y fecha");
  if (err) return { ok: false, error: err };

  const { data: existing } = await db.from("people").select("added_by_id,user_id").eq("id", personId).maybeSingle();
  if (!existing || (existing.added_by_id !== me.id && existing.user_id !== me.id)) {
    return { ok: false, error: "No podés editar esta fecha." };
  }

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

export async function deletePerson(personId: string): Promise<{ ok: boolean; error?: string }> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Sesión vencida" };

  const { data: existing } = await db.from("people").select("added_by_id,user_id").eq("id", personId).maybeSingle();
  if (!existing || (existing.added_by_id !== me.id && existing.user_id !== me.id)) {
    return { ok: false, error: "No podés borrar esta fecha." };
  }
  const { error } = await db.from("people").delete().eq("id", personId);
  if (error) return { ok: false, error: "No se pudo borrar." };
  revalidatePath("/", "layout");
  return { ok: true };
}

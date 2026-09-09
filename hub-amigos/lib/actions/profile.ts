"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { getCurrentUser, normName } from "@/lib/auth";

export async function saveName(name: string): Promise<{ ok: boolean; error?: string }> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Sesión vencida" };
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Poné un nombre" };

  const { data: taken } = await db.from("users").select("id").neq("id", me.id).eq("name_key", normName(trimmed)).eq("is_guest", false).maybeSingle();
  if (taken) return { ok: false, error: "Ya hay alguien con ese nombre" };

  await db.from("users").update({ name: trimmed }).eq("id", me.id);
  await db.from("people").update({ name: trimmed }).eq("user_id", me.id);

  revalidatePath("/", "layout");
  return { ok: true };
}

function validDate(day: number, month: number, year: number) {
  if (!day || !month || !year) return "Elegí día, mes y año";
  if (day > new Date(year, month, 0).getDate()) return "Esa fecha no existe";
  return null;
}

export async function saveBirthday(day: number, month: number, year: number): Promise<{ ok: boolean; error?: string }> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: "Sesión vencida" };
  const err = validDate(day, month, year);
  if (err) return { ok: false, error: err };

  const { data: existing } = await db.from("people").select("id").eq("user_id", me.id).maybeSingle();
  if (existing) {
    await db.from("people").update({ day, month, year }).eq("id", existing.id);
  } else {
    await db.from("people").insert({ name: me.name, kind: "cumple", day, month, year, user_id: me.id, added_by_id: me.id });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveAlias(alias: string): Promise<{ ok: boolean }> {
  const me = await getCurrentUser();
  if (!me) return { ok: false };
  await db.from("users").update({ alias: alias.trim() }).eq("id", me.id);
  revalidatePath("/", "layout");
  return { ok: true };
}

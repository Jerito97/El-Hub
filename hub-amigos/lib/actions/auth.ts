"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { clearSessionCookie, createSessionCookie, hashPin, normName, verifyPin } from "@/lib/auth";

export interface LoginResult {
  ok: boolean;
  error?: string;
  hint?: string;
  needsSetup?: boolean;
  linkCandidate?: { id: string; name: string; dateLabel: string; daysLabel: string };
}

/** Mirrors submitLogin() in the prototype: new name -> setup, existing name -> validate PIN. */
export async function submitLogin(name: string, pin: string): Promise<LoginResult> {
  const trimmedName = name.trim();
  const trimmedPin = pin.trim();
  if (!trimmedName) return { ok: false, error: "Falta tu nombre", hint: "Escribí el nombre con el que te conocen en el grupo." };
  if (!/^\d{4,6}$/.test(trimmedPin)) return { ok: false, error: "PIN inválido", hint: "Tiene que ser de 4 a 6 números." };

  const { data: existing } = await db.from("users").select("*").eq("name_key", normName(trimmedName)).maybeSingle();
  if (existing) {
    const valid = await verifyPin(trimmedPin, existing.pin_hash);
    if (!valid) {
      return {
        ok: false,
        error: "PIN incorrecto",
        hint: `El nombre ${existing.name} ya existe. Probá de nuevo o pedile a alguien que te resetee el PIN.`,
      };
    }
    await createSessionCookie(existing.id);
    revalidatePath("/", "layout");
    redirect("/home");
  }

  const { data: candidate } = await db
    .from("people")
    .select("*")
    .is("user_id", null)
    .ilike("name", trimmedName)
    .limit(1)
    .maybeSingle();
  if (candidate) {
    return {
      ok: true,
      linkCandidate: {
        id: candidate.id,
        name: candidate.name,
        dateLabel: `${String(candidate.day).padStart(2, "0")}/${String(candidate.month).padStart(2, "0")}/${candidate.year}`,
        daysLabel: "",
      },
    };
  }

  return { ok: true, needsSetup: true };
}

export interface SetupInput {
  name: string;
  pin: string;
  day: number;
  month: number;
  year: number;
  alias: string;
}

function validDate(day: number, month: number, year: number) {
  if (!day || !month || !year) return "Elegí día, mes y año";
  if (day > new Date(year, month, 0).getDate()) return "Esa fecha no existe";
  return null;
}

/** New-user onboarding: creates the user, their prefs row, and their own birthday entry. */
export async function finishSetup(input: SetupInput): Promise<LoginResult> {
  const err = validDate(input.day, input.month, input.year);
  if (err) return { ok: false, error: err };

  const name = input.name.trim();
  const { data: taken } = await db.from("users").select("id").eq("name_key", normName(name)).maybeSingle();
  if (taken) return { ok: false, error: "Ese nombre ya está en uso", hint: "Volvé atrás e ingresá con tu PIN." };

  const pin_hash = await hashPin(input.pin.trim());
  const { data: user, error } = await db
    .from("users")
    .insert({ name, pin_hash, alias: (input.alias || "").trim() })
    .select("id")
    .single();
  if (error || !user) return { ok: false, error: "No se pudo crear el usuario, probá de nuevo." };

  await db.from("prefs").insert({ user_id: user.id });
  await db.from("people").insert({
    name,
    kind: "cumple",
    day: input.day,
    month: input.month,
    year: input.year,
    user_id: user.id,
    added_by_id: user.id,
  });

  await createSessionCookie(user.id);
  revalidatePath("/", "layout");
  redirect("/home");
}

/** User says "yes that's me" on the link-suggestion screen: attaches their new account to the pre-loaded birthday. */
export async function confirmLink(personId: string, pin: string): Promise<LoginResult> {
  if (!/^\d{4,6}$/.test(pin.trim())) return { ok: false, error: "PIN inválido", hint: "Tiene que ser de 4 a 6 números." };

  const { data: person } = await db.from("people").select("*").eq("id", personId).is("user_id", null).maybeSingle();
  if (!person) return { ok: false, error: "Ese registro ya no está disponible." };

  const pin_hash = await hashPin(pin.trim());
  const { data: user, error } = await db.from("users").insert({ name: person.name, pin_hash, alias: "" }).select("id").single();
  if (error || !user) return { ok: false, error: "No se pudo crear el usuario, probá de nuevo." };

  await db.from("prefs").insert({ user_id: user.id });
  await db.from("people").update({ user_id: user.id }).eq("id", person.id);

  await createSessionCookie(user.id);
  revalidatePath("/", "layout");
  redirect("/home");
}

export async function logoutAction() {
  await clearSessionCookie();
  revalidatePath("/", "layout");
  redirect("/login");
}

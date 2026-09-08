"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import type { PrefsRow } from "@/lib/types";

export async function updatePrefs(patch: Partial<Omit<PrefsRow, "user_id">>): Promise<{ ok: boolean }> {
  const me = await getCurrentUser();
  if (!me) return { ok: false };
  await db.from("prefs").upsert({ user_id: me.id, ...patch });
  revalidatePath("/", "layout");
  return { ok: true };
}

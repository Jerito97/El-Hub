"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";

export async function markNotifRead(notifId: string): Promise<{ ok: boolean }> {
  const me = await getCurrentUser();
  if (!me) return { ok: false };
  await db.from("notification_reads").upsert({ user_id: me.id, notif_id: notifId });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markAllRead(notifIds: string[]): Promise<{ ok: boolean }> {
  const me = await getCurrentUser();
  if (!me) return { ok: false };
  if (notifIds.length) {
    await db.from("notification_reads").upsert(notifIds.map((notif_id) => ({ user_id: me.id, notif_id })));
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

"use server";

import { db } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function subscribeToPush(sub: PushSubscriptionInput): Promise<{ ok: boolean }> {
  const me = await getCurrentUser();
  if (!me) return { ok: false };

  const { error } = await db
    .from("push_subscriptions")
    .upsert({ user_id: me.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth }, { onConflict: "endpoint" });
  return { ok: !error };
}

export async function unsubscribeFromPush(endpoint: string): Promise<{ ok: boolean }> {
  const me = await getCurrentUser();
  if (!me) return { ok: false };

  await db.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", me.id);
  return { ok: true };
}

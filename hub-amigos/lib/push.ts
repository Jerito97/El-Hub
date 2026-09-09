import "server-only";
import webpush from "web-push";
import { db } from "./supabase";

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  const { VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;
  if (!VAPID_SUBJECT || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** Sends a push to every subscribed device of each user in `userIds`. Prunes subscriptions the browser has revoked. */
export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  const ids = Array.from(new Set(userIds));
  if (ids.length === 0) return;
  if (!ensureConfigured()) {
    console.warn("[push] VAPID env vars not set -- skipping push send.");
    return;
  }

  const { data: subs, error } = await db.from("push_subscriptions").select("*").in("user_id", ids);
  if (error || !subs || subs.length === 0) return;

  const body = JSON.stringify(payload);
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body);
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await db.from("push_subscriptions").delete().eq("id", s.id);
        } else {
          console.error("[push] send failed:", err);
        }
      }
    })
  );
}

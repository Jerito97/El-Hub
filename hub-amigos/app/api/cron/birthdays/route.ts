import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { sendPushToUsers } from "@/lib/push";
import { nowInAppTz } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * Runs once a day (see vercel.json) at ~09:00 Argentina time. Pushes a
 * "cumple/aniversario hoy" alert to everyone with notif_cumple on -- except
 * the birthday person themself, and except for private entries, which only
 * go to whoever added them.
 */
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const today = nowInAppTz();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  const [{ data: people }, { data: prefsRows }] = await Promise.all([
    db.from("people").select("*").eq("month", month).eq("day", day).eq("remind", true),
    db.from("prefs").select("user_id").eq("notif_cumple", true),
  ]);

  if (!people || people.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const eligible = new Set((prefsRows || []).map((p) => p.user_id));
  let sent = 0;

  for (const p of people) {
    const isAniv = p.kind === "aniversario";
    const targets = p.is_private
      ? eligible.has(p.added_by_id) && p.added_by_id !== p.user_id
        ? [p.added_by_id]
        : []
      : Array.from(eligible).filter((id) => id !== p.user_id);
    if (targets.length === 0) continue;

    await sendPushToUsers(targets, {
      title: isAniv ? `Aniversario de ${p.name}, hoy` : `${p.name} cumple hoy`,
      body: "Tocá para ver el detalle en LinkUp",
      url: "/fechas",
    });
    sent += targets.length;
  }

  return NextResponse.json({ ok: true, sent });
}

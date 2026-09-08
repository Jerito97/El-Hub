"use client";

import { useRouter } from "next/navigation";
import { useAppShell } from "@/lib/client/AppShellContext";
import { markAllRead, markNotifRead } from "@/lib/actions/notifications";
import type { NotifItem } from "@/lib/domain";

export interface NotifWithHref extends NotifItem {
  href: string;
}

export function NotificationsPanel({ notifs }: { notifs: NotifWithHref[] }) {
  const { notifsOpen, setNotifsOpen } = useAppShell();
  const router = useRouter();
  if (!notifsOpen) return null;

  const unread = notifs.filter((n) => n.unread).length;

  async function open(n: NotifWithHref) {
    setNotifsOpen(false);
    router.push(n.href);
    if (n.unread) await markNotifRead(n.id);
  }

  return (
    <div className="overlay" style={{ display: "flex", justifyContent: "flex-end" }} onClick={() => setNotifsOpen(false)}>
      <div className="side-panel-right" onClick={(e) => e.stopPropagation()}>
        <div style={{ flex: "none", padding: 18, borderBottom: "2px solid var(--color-divider)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 20, lineHeight: 1 }}>Notificaciones</div>
            <div style={{ marginTop: 4, fontSize: "11.5px", color: "var(--color-neutral-600)" }}>{unread ? `${unread} sin leer` : "Todo leído"}</div>
          </div>
          <button
            type="button"
            onClick={() => setNotifsOpen(false)}
            style={{ width: 30, height: 30, flex: "none", background: "transparent", border: "2px solid var(--color-text)", cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 13, lineHeight: 1, color: "var(--color-text)" }}
          >
            ✕
          </button>
        </div>

        <div className="hub-scroll" style={{ flex: 1, overflowY: "auto" }}>
          {notifs.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => open(n)}
              style={{ width: "100%", textAlign: "left", background: n.unread ? "var(--color-neutral-100)" : "transparent", border: 0, borderBottom: "1px solid var(--color-neutral-300)", padding: "15px 16px", cursor: "pointer", display: "flex", gap: 12, alignItems: "flex-start" }}
            >
              <span
                style={{
                  width: 30,
                  height: 30,
                  flex: "none",
                  background: n.kind === "cumple" ? "var(--color-accent-600)" : "var(--color-text)",
                  color: n.kind === "cumple" ? "#fff" : "var(--color-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                  fontFamily: "var(--font-heading)",
                  fontWeight: 900,
                  fontSize: 13,
                }}
              >
                {n.icon}
              </span>
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "14.5px", lineHeight: 1.2 }}>{n.title}</span>
                <span style={{ fontSize: 12, color: "var(--color-neutral-700)", lineHeight: 1.35 }}>{n.body}</span>
              </span>
              {n.unread && <span style={{ width: 8, height: 8, flex: "none", marginTop: 6, background: "var(--color-text)", borderRadius: 999 }} />}
            </button>
          ))}
          {notifs.length === 0 && (
            <div style={{ padding: "34px 20px", textAlign: "center", fontSize: 13, color: "var(--color-neutral-600)" }}>Estás al día. No hay nada nuevo.</div>
          )}
        </div>

        <button
          type="button"
          onClick={() => markAllRead(notifs.map((n) => n.id))}
          style={{ flex: "none", background: "transparent", border: 0, borderTop: "2px solid var(--color-divider)", padding: 16, cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 12, color: "var(--color-accent-700)", textTransform: "uppercase", letterSpacing: ".06em" }}
        >
          Marcar todo como leído
        </button>
      </div>
    </div>
  );
}

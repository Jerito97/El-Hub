"use client";

import { useAppShell } from "@/lib/client/AppShellContext";

export function Header({ meInitials, unreadCount }: { meInitials: string; unreadCount: number }) {
  const { setDrawerOpen, setNotifsOpen } = useAppShell();
  return (
    <div
      style={{
        flex: "none",
        display: "grid",
        gridTemplateColumns: "44px 1fr 44px",
        alignItems: "center",
        padding: "9px 12px",
        borderBottom: "2px solid var(--color-divider)",
      }}
    >
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        title="Menú"
        style={{ width: 44, height: 44, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, background: "transparent", border: 0, padding: 0, cursor: "pointer" }}
      >
        <span style={{ width: 20, height: 2, background: "var(--color-text)" }} />
        <span style={{ width: 20, height: 2, background: "var(--color-text)" }} />
        <span style={{ width: 20, height: 2, background: "var(--color-text)" }} />
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <img src="/icon-192.png" alt="" width={18} height={18} style={{ borderRadius: 4 }} />
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "11.5px", letterSpacing: ".16em", textTransform: "uppercase" }}>LinkUp</span>
      </div>

      <button
        type="button"
        onClick={() => setNotifsOpen(true)}
        title="Notificaciones"
        style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: 0, cursor: "pointer", padding: 0, position: "relative" }}
      >
        <span style={{ width: 32, height: 32, background: "var(--color-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 13 }}>
          {meInitials}
        </span>
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              left: 29,
              top: -3,
              width: 18,
              height: 18,
              background: "var(--color-text)",
              color: "var(--color-bg)",
              border: "2px solid var(--color-bg)",
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-heading)",
              fontWeight: 900,
              fontSize: "9.5px",
              lineHeight: 1,
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}

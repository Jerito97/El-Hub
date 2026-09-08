"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppShell } from "@/lib/client/AppShellContext";
import { logoutAction } from "@/lib/actions/auth";

const NAV = [
  { href: "/home", label: "Inicio", match: (p: string) => p === "/home" },
  { href: "/fechas", label: "Fechas", match: (p: string) => p.startsWith("/fechas") },
  { href: "/gastos", label: "Gastos", match: (p: string) => p.startsWith("/gastos") },
  { href: "/personas", label: "Personas", match: (p: string) => p.startsWith("/personas") },
];

const navStyle = (active: boolean): React.CSSProperties => ({
  display: "block",
  width: "100%",
  textAlign: "left",
  background: active ? "var(--color-text)" : "transparent",
  color: active ? "var(--color-bg)" : "var(--color-text)",
  border: 0,
  borderBottom: "1px solid var(--color-neutral-300)",
  padding: "16px 18px",
  cursor: "pointer",
  fontFamily: "var(--font-heading)",
  fontWeight: 800,
  fontSize: 14,
  textTransform: "uppercase",
  letterSpacing: ".06em",
});

export function Drawer({ meName, meInitials, meBirthdayLabel }: { meName: string; meInitials: string; meBirthdayLabel: string }) {
  const { drawerOpen, setDrawerOpen } = useAppShell();
  const pathname = usePathname();
  if (!drawerOpen) return null;
  const configActive = pathname.startsWith("/config");

  return (
    <div className="overlay" style={{ display: "flex" }} onClick={() => setDrawerOpen(false)}>
      <div className="side-drawer" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 18px", borderBottom: "2px solid var(--color-divider)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, flex: "none", background: "var(--color-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 16 }}>
            {meInitials}
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 18 }}>{meName}</div>
            <div style={{ fontSize: "11.5px", color: "var(--color-neutral-600)" }}>{meBirthdayLabel}</div>
          </div>
        </div>

        {NAV.map((item) => (
          <Link key={item.href} href={item.href} onClick={() => setDrawerOpen(false)} style={navStyle(item.match(pathname))}>
            {item.label}
          </Link>
        ))}
        <Link href="/config" onClick={() => setDrawerOpen(false)} style={navStyle(configActive)}>
          Configuración
        </Link>

        <form action={logoutAction} style={{ marginTop: "auto" }}>
          <button
            type="submit"
            style={{ width: "100%", textAlign: "left", background: "transparent", border: 0, borderTop: "2px solid var(--color-divider)", padding: 18, cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 13, color: "var(--color-accent-700)", textTransform: "uppercase", letterSpacing: ".06em" }}
          >
            Salir de la sesión
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

// Left-side navigation drawer: profile summary + links to every top-level
// section, plus Admin when applicable and the logout button. Opened from
// Header's menu button or by swiping in from the left edge (EdgeSwipe).

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppShell } from "@/lib/client/AppShellContext";
import { logoutAction } from "@/lib/actions/auth";
import { avatarColor } from "@/lib/format";

const NAV = [
  { href: "/home", label: "Inicio", match: (p: string) => p === "/home" },
  { href: "/fechas", label: "Fechas", match: (p: string) => p.startsWith("/fechas") },
  { href: "/gastos", label: "Gastos", match: (p: string) => p.startsWith("/gastos") },
  { href: "/personas", label: "Personas", match: (p: string) => p.startsWith("/personas") },
];

const navStyle = (active: boolean): React.CSSProperties => ({
  display: "block",
  width: "auto",
  margin: "0 12px 4px",
  textAlign: "left",
  background: active ? "var(--color-accent)" : "transparent",
  color: active ? "#fff" : "var(--color-text)",
  border: 0,
  borderRadius: "var(--radius-md)",
  padding: "13px 16px",
  cursor: "pointer",
  fontFamily: "var(--font-heading)",
  fontWeight: 700,
  fontSize: 14.5,
});

export function Drawer({
  meId,
  meName,
  meInitials,
  meBirthdayLabel,
  isAdmin,
}: {
  meId: string;
  meName: string;
  meInitials: string;
  meBirthdayLabel: string;
  isAdmin: boolean;
}) {
  const { drawerOpen, setDrawerOpen } = useAppShell();
  const pathname = usePathname();
  if (!drawerOpen) return null;
  const configActive = pathname.startsWith("/config");
  const adminActive = pathname.startsWith("/admin");
  const me = avatarColor(meId);

  return (
    <div className="overlay" style={{ display: "flex" }} onClick={() => setDrawerOpen(false)}>
      <div className="side-drawer" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "22px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", flex: "none", background: me.bg, color: me.fg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 16 }}>
            {meInitials}
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 18 }}>{meName}</div>
            <div style={{ fontSize: "11.5px", color: "var(--color-neutral-600)" }}>{meBirthdayLabel}</div>
          </div>
        </div>

        <div style={{ marginTop: 6, display: "flex", flexDirection: "column" }}>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setDrawerOpen(false)} style={navStyle(item.match(pathname))}>
              {item.label}
            </Link>
          ))}
          <Link href="/config" onClick={() => setDrawerOpen(false)} style={navStyle(configActive)}>
            Configuración
          </Link>
          {isAdmin && (
            <Link href="/admin" onClick={() => setDrawerOpen(false)} style={navStyle(adminActive)}>
              Admin
            </Link>
          )}
        </div>

        <form action={logoutAction} style={{ marginTop: "auto", padding: 12 }}>
          <button
            type="submit"
            style={{ width: "100%", textAlign: "left", background: "transparent", border: 0, borderRadius: "var(--radius-md)", padding: "13px 16px", cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13.5, color: "var(--color-accent-700)" }}
          >
            Salir de la sesión
          </button>
        </form>
      </div>
    </div>
  );
}

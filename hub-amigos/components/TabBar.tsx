"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/home", label: "Inicio", match: (p: string) => p === "/home" },
  { href: "/fechas", label: "Fechas", match: (p: string) => p.startsWith("/fechas") },
  { href: "/gastos", label: "Gastos", match: (p: string) => p.startsWith("/gastos") },
];

const HIDDEN_ON = ["/home", "/personas", "/config"];

export function TabBar() {
  const pathname = usePathname();
  const hidden = HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (hidden) return null;

  return (
    <div style={{ flex: "none", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "2px solid var(--color-text)", background: "var(--color-neutral-100)" }}>
      {TABS.map((t) => {
        const active = t.match(pathname);
        return (
          <Link
            key={t.href}
            href={t.href}
            style={{
              background: active ? "var(--color-text)" : "var(--color-neutral-100)",
              color: active ? "var(--color-bg)" : "var(--color-neutral-700)",
              padding: "14px 12px",
              textAlign: "center",
              fontFamily: "var(--font-heading)",
              fontWeight: 800,
              fontSize: "12.5px",
              textTransform: "uppercase",
              letterSpacing: ".07em",
              borderRight: "1px solid var(--color-neutral-300)",
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

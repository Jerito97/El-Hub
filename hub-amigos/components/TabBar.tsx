"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/home",
    label: "Inicio",
    match: (p: string) => p === "/home",
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l9-8 9 8" />
        <path d="M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    href: "/fechas",
    label: "Fechas",
    match: (p: string) => p.startsWith("/fechas"),
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    href: "/gastos",
    label: "Gastos",
    match: (p: string) => p.startsWith("/gastos"),
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="6" rx="8" ry="3" />
        <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
        <path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
      </svg>
    ),
  },
];

const HIDDEN_ON = ["/personas", "/config"];

export function TabBar() {
  const pathname = usePathname();
  const hidden = HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (hidden) return null;

  return (
    <div style={{ flex: "none", padding: "0 16px calc(14px + env(safe-area-inset-bottom))" }}>
      <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", padding: 8, display: "flex", alignItems: "center", gap: 4, boxShadow: "var(--shadow-float)" }}>
        {TABS.map((t) => {
          const active = t.match(pathname);
          return (
            <Link
              key={t.href}
              href={t.href}
              style={{
                flex: 1,
                background: active ? "var(--color-accent)" : "transparent",
                color: active ? "#fff" : "var(--color-neutral-600)",
                padding: "9px 0",
                borderRadius: "var(--radius-md)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: "10.5px",
              }}
            >
              <span style={{ display: "flex" }}>{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

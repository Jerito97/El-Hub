"use client";

import { useState } from "react";
import Link from "next/link";
import { avatarColor } from "@/lib/format";

export function PersonaDetailClient({
  userId,
  initials,
  name,
  birthday,
  alias,
  stateLabel,
  amountLabel,
  amountColor,
  sharedLabel,
}: {
  userId: string;
  initials: string;
  name: string;
  birthday: string;
  alias: string;
  stateLabel: string;
  amountLabel: string;
  amountColor: string;
  sharedLabel: string;
}) {
  const c = avatarColor(userId);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(alias);
    } catch {
      // ignore
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div style={{ padding: "18px 18px 30px" }}>
      <Link href="/personas" style={{ background: "transparent", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>
        ← Personas
      </Link>
      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", flex: "none", background: c.bg, color: c.fg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22 }}>{initials}</div>
        <div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 26, lineHeight: 1.05 }}>{name}</div>
          <div style={{ fontSize: "12.5px", color: "var(--color-neutral-700)" }}>Cumpleaños: {birthday}</div>
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>Alias</div>
        {alias ? (
          <div style={{ marginTop: 9, display: "flex", alignItems: "stretch", background: "#fff", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
            <div style={{ flex: 1, minWidth: 0, padding: "12px 14px", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{alias}</div>
            <button type="button" onClick={copy} style={{ flex: "none", background: "var(--color-accent-600)", color: "#fff", border: 0, padding: "0 16px", cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: ".05em" }}>
              {copied ? "¡Copiado!" : "Copiar"}
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 8, fontSize: "12.5px", color: "var(--color-neutral-700)" }}>Todavía no cargó su alias.</div>
        )}
      </div>

      <div style={{ marginTop: 16, background: "#fff", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)", padding: "16px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "10.5px", letterSpacing: ".09em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>{stateLabel}</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 24, color: amountColor }}>{amountLabel}</div>
        </div>
        <div style={{ fontSize: 12, color: "var(--color-neutral-700)", textAlign: "right" }}>{sharedLabel}</div>
      </div>
    </div>
  );
}

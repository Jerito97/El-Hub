"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { markPaid, markReceived, undoPaid } from "@/lib/actions/events";
import { money } from "@/lib/format";

export interface DebtRow {
  toId: string;
  to: string;
  isGuest: boolean;
  initials: string;
  amount: number;
  alias: string;
}
export interface OwedRow {
  fromId: string;
  from: string;
  isGuest: boolean;
  initials: string;
  amount: number;
}

export function PayModal({
  eventId,
  myDebts,
  owedToMe,
  onClose,
}: {
  eventId: string;
  myDebts: DebtRow[];
  owedToMe: OwedRow[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [justPaid, setJustPaid] = useState<{ label: string; paymentId: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function copyAlias(alias: string, key: string) {
    try {
      await navigator.clipboard.writeText(alias);
    } catch {
      // ignore
    }
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1600);
  }

  async function pay(d: DebtRow) {
    setBusy(true);
    const res = await markPaid(eventId, d.toId, d.amount);
    setBusy(false);
    if (res.ok && res.paymentId) setJustPaid({ label: `Pago registrado: ${money(d.amount)} a ${d.to}`, paymentId: res.paymentId });
    router.refresh();
  }

  async function receive(o: OwedRow) {
    setBusy(true);
    const res = await markReceived(eventId, o.fromId, o.amount);
    setBusy(false);
    if (res.ok && res.paymentId) setJustPaid({ label: `Cobro registrado: ${money(o.amount)} de ${o.from}`, paymentId: res.paymentId });
    router.refresh();
  }

  async function undo() {
    if (!justPaid) return;
    setBusy(true);
    await undoPaid(justPaid.paymentId);
    setBusy(false);
    setJustPaid(null);
    router.refresh();
  }

  const total = myDebts.reduce((a, d) => a + d.amount, 0);
  const noDebts = myDebts.length === 0 && owedToMe.length === 0;

  return (
    <Sheet title={myDebts.length ? "Pagar tu parte" : "Cuentas del evento"} onClose={onClose}>
      {justPaid && (
        <div style={{ marginBottom: 16, border: "2px solid var(--color-text)", background: "var(--color-neutral-100)", padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ flex: 1, fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "13.5px" }}>{justPaid.label}</span>
          <button type="button" onClick={undo} disabled={busy} style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "12.5px", color: "var(--color-accent-700)", textDecoration: "underline", textUnderlineOffset: 3 }}>
            Deshacer
          </button>
        </div>
      )}

      {myDebts.length > 0 && (
        <div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 30, lineHeight: 1 }}>{money(total)}</div>
          <div style={{ fontSize: "12.5px", color: "var(--color-neutral-700)", marginTop: 2 }}>{myDebts.length === 1 ? "a una persona de este evento" : `repartido entre ${myDebts.length} personas`}</div>
          <div style={{ marginTop: 16, borderTop: "2px solid var(--color-divider)" }}>
            {myDebts.map((d) => (
              <div key={d.toId} style={{ padding: "14px 0", borderBottom: "1px solid var(--color-neutral-300)", display: "flex", flexDirection: "column", gap: 9 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 38, height: 38, flex: "none", background: "var(--color-accent-600)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 13 }}>{d.initials}</div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "16.5px" }}>
                    {d.to}
                    {d.isGuest && <span className="tag tag-muted">Invitado</span>}
                  </div>
                  <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 17 }}>{money(d.amount)}</div>
                </div>
                {d.alias ? (
                  <div style={{ display: "flex", alignItems: "stretch", border: "2px solid var(--color-text)" }}>
                    <div style={{ flex: 1, minWidth: 0, padding: "10px 12px", background: "var(--color-neutral-100)", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "13.5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.alias}</div>
                    <button type="button" onClick={() => copyAlias(d.alias, d.toId)} style={{ flex: "none", background: "var(--color-accent-600)", color: "#fff", border: 0, borderLeft: "2px solid var(--color-text)", padding: "0 14px", cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 12 }}>
                      {copied === d.toId ? "¡Copiado!" : "Copiar"}
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--color-neutral-700)", borderLeft: "3px solid var(--color-accent-600)", paddingLeft: 10 }}>{d.to} todavía no cargó su alias.</div>
                )}
                <button type="button" disabled={busy} onClick={() => pay(d)} style={{ width: "100%", background: "var(--color-text)", color: "var(--color-bg)", border: 0, padding: "12px 14px", cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 13 }}>
                  Ya se lo pagué
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {owedToMe.length > 0 && (
        <div style={{ marginTop: myDebts.length ? 20 : 0, borderTop: myDebts.length ? "2px solid var(--color-divider)" : undefined, paddingTop: myDebts.length ? 14 : 0 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>Te deben</div>
          {owedToMe.map((o) => (
            <div key={o.fromId} style={{ padding: "12px 0", borderBottom: "1px solid var(--color-neutral-300)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 34, height: 34, flex: "none", background: "var(--color-text)", color: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 12 }}>{o.initials}</div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 15 }}>
                {o.from}
                {o.isGuest && <span className="tag tag-muted">Invitado</span>}
              </div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15 }}>{money(o.amount)}</div>
              <button type="button" disabled={busy} onClick={() => receive(o)} style={{ flex: "none", background: "var(--color-text)", color: "var(--color-bg)", border: 0, padding: "9px 11px", cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em" }}>
                Ya me pagó
              </button>
            </div>
          ))}
        </div>
      )}

      {noDebts && (
        <div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 26, lineHeight: 1.05 }}>Estás al día</div>
          <div style={{ fontSize: 13, color: "var(--color-neutral-700)", marginTop: 6 }}>Todavía no hay gastos cargados.</div>
        </div>
      )}
    </Sheet>
  );
}

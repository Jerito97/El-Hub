"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PayModal, type DebtRow, type OwedRow } from "@/components/PayModal";
import { BalanceModal, type PaymentLog } from "@/components/BalanceModal";
import { ExpenseModal } from "@/components/ExpenseModal";
import { closeEvent } from "@/lib/actions/events";
import { money } from "@/lib/format";
import type { Settlement } from "@/lib/domain";

export interface ExpenseView {
  desc: string;
  amount: number;
  payer: string;
  payerInitials: string;
  sharesLabel: string;
}

export function EventDetailClient({
  eventId,
  meId,
  eventName,
  eventDateLabel,
  eventParticipantsLabel,
  eventCreatorLabel,
  eventIsClosed,
  payButtonLabel,
  myDebts,
  owedToMe,
  settlements,
  payments,
  participants,
  eventTotal,
  eventExpenses,
  canCloseEvent,
  closeBlocked,
}: {
  eventId: string;
  meId: string;
  eventName: string;
  eventDateLabel: string;
  eventParticipantsLabel: string;
  eventCreatorLabel: string;
  eventIsClosed: boolean;
  payButtonLabel: string;
  myDebts: DebtRow[];
  owedToMe: OwedRow[];
  settlements: Settlement[];
  payments: PaymentLog[];
  participants: { id: string; name: string }[];
  eventTotal: number;
  eventExpenses: ExpenseView[];
  canCloseEvent: boolean;
  closeBlocked: boolean;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<"pay" | "balance" | "expense" | null>(null);
  const [busy, setBusy] = useState(false);

  async function doClose() {
    setBusy(true);
    await closeEvent(eventId);
    setBusy(false);
    router.refresh();
  }

  return (
    <div style={{ padding: "18px 18px 30px" }}>
      <Link href="/gastos" style={{ background: "transparent", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>
        ← Gastos
      </Link>
      <h1 style={{ fontSize: 32, lineHeight: 1.02, margin: "14px 0 0" }}>{eventName}</h1>
      <div style={{ marginTop: 6, fontSize: 13, color: "var(--color-neutral-700)" }}>
        {eventDateLabel} · {eventParticipantsLabel}
      </div>
      <div style={{ marginTop: 3, fontSize: "11.5px", color: "var(--color-neutral-600)" }}>{eventCreatorLabel}</div>

      {eventIsClosed ? (
        <div style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8, border: "2px solid var(--color-text)", padding: "8px 12px" }}>
          <span style={{ width: 10, height: 10, background: "var(--color-text)" }} />
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "11.5px", letterSpacing: ".08em", textTransform: "uppercase" }}>Evento cerrado</span>
        </div>
      ) : (
        <>
          <button type="button" className="btn btn-block" style={{ marginTop: 16, background: "var(--color-accent-600)", color: "#fff" }} onClick={() => setModal("pay")}>
            {payButtonLabel}
          </button>
          <button type="button" className="btn btn-block btn-dark" style={{ marginTop: 8 }} onClick={() => setModal("balance")}>
            Ver balance final
          </button>
          <button type="button" className="btn btn-secondary btn-block btn-upper" style={{ marginTop: 8 }} onClick={() => setModal("expense")}>
            Cargar gasto
          </button>
          {canCloseEvent && (
            <button type="button" className="btn btn-outline btn-block" style={{ marginTop: 8 }} disabled={busy} onClick={doClose}>
              Cerrar evento
            </button>
          )}
          {closeBlocked && (
            <div>
              <button type="button" className="btn btn-block" disabled style={{ marginTop: 8, border: "2px solid var(--color-neutral-400)", color: "var(--color-neutral-500)" }}>
                Cerrar evento
              </button>
              <div style={{ marginTop: 6, fontSize: 12, color: "var(--color-neutral-600)" }}>No se puede cerrar con deudas sin saldar.</div>
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: 22, display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderBottom: "2px solid var(--color-divider)", paddingBottom: 10 }}>
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>Gastos</span>
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 17 }}>{money(eventTotal)}</span>
      </div>

      {eventExpenses.map((x, i) => (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 2px", borderBottom: "1px solid var(--color-neutral-300)" }}>
          <div style={{ width: 38, height: 38, flex: "none", background: "var(--color-neutral-200)", border: "1px solid var(--color-neutral-400)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 12 }}>{x.payerInitials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "15.5px" }}>{x.desc}</div>
            <div style={{ fontSize: 12, color: "var(--color-neutral-700)" }}>
              Pagó {x.payer} · {x.sharesLabel}
            </div>
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 15, flex: "none" }}>{money(x.amount)}</div>
        </div>
      ))}

      {modal === "pay" && <PayModal eventId={eventId} myDebts={myDebts} owedToMe={owedToMe} onClose={() => setModal(null)} />}
      {modal === "balance" && <BalanceModal settlements={settlements} payments={payments} onClose={() => setModal(null)} />}
      {modal === "expense" && <ExpenseModal eventId={eventId} meId={meId} participants={participants} onClose={() => setModal(null)} />}
    </div>
  );
}

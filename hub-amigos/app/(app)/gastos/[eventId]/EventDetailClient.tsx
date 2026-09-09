"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PayModal, type DebtRow, type OwedRow } from "@/components/PayModal";
import { BalanceModal, type PaymentLog } from "@/components/BalanceModal";
import { ExpenseModal, type ExpenseModalInitial } from "@/components/ExpenseModal";
import { EventModal } from "@/components/EventModal";
import { closeEvent } from "@/lib/actions/events";
import { money } from "@/lib/format";
import type { Settlement } from "@/lib/domain";

export interface ExpenseView {
  id: string;
  desc: string;
  amount: number;
  payerId: string;
  payer: string;
  payerInitials: string;
  shareIds: string[];
  sharesLabel: string;
}

export function EventDetailClient({
  eventId,
  meId,
  eventName,
  eventDateLabel,
  eventParticipantsLabel,
  eventCreatorLabel,
  eventCreatorId,
  eventIsClosed,
  payButtonLabel,
  myDebts,
  owedToMe,
  settlements,
  payments,
  participants,
  allUsers,
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
  eventCreatorId: string;
  eventIsClosed: boolean;
  payButtonLabel: string;
  myDebts: DebtRow[];
  owedToMe: OwedRow[];
  settlements: Settlement[];
  payments: PaymentLog[];
  participants: { id: string; name: string }[];
  allUsers: { id: string; name: string }[];
  eventTotal: number;
  eventExpenses: ExpenseView[];
  canCloseEvent: boolean;
  closeBlocked: boolean;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<"pay" | "balance" | "expense" | "event" | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseModalInitial | null>(null);
  const [busy, setBusy] = useState(false);

  function openExpense(x?: ExpenseView) {
    setEditingExpense(x ? { id: x.id, desc: x.desc, amount: x.amount, payerId: x.payerId, shareIds: x.shareIds } : null);
    setModal("expense");
  }

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
      <div style={{ marginTop: 14, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontSize: 32, lineHeight: 1.02, margin: 0 }}>{eventName}</h1>
        {!eventIsClosed && (
          <button type="button" title="Editar evento" className="tap-icon" style={{ marginTop: 6 }} onClick={() => setModal("event")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
            </svg>
          </button>
        )}
      </div>
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
          <button type="button" className="btn btn-secondary btn-block btn-upper" style={{ marginTop: 8 }} onClick={() => openExpense()}>
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

      {eventExpenses.map((x) => (
        <div key={x.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 2px", borderBottom: "1px solid var(--color-neutral-300)" }}>
          <div style={{ width: 38, height: 38, flex: "none", background: "var(--color-neutral-200)", border: "1px solid var(--color-neutral-400)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 12 }}>{x.payerInitials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "15.5px" }}>{x.desc}</div>
            <div style={{ fontSize: 12, color: "var(--color-neutral-700)" }}>
              Pagó {x.payer} · {x.sharesLabel}
            </div>
          </div>
          {!eventIsClosed && (
            <button type="button" title="Editar gasto" className="tap-icon" onClick={() => openExpense(x)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
              </svg>
            </button>
          )}
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 15, flex: "none" }}>{money(x.amount)}</div>
        </div>
      ))}

      {modal === "pay" && <PayModal eventId={eventId} myDebts={myDebts} owedToMe={owedToMe} onClose={() => setModal(null)} />}
      {modal === "balance" && <BalanceModal settlements={settlements} payments={payments} onClose={() => setModal(null)} />}
      {modal === "expense" && (
        <ExpenseModal eventId={eventId} meId={meId} participants={participants} initial={editingExpense ?? undefined} onClose={() => setModal(null)} />
      )}
      {modal === "event" && (
        <EventModal
          meId={meId}
          users={allUsers}
          initial={{ id: eventId, name: eventName, participantIds: participants.map((p) => p.id), creatorId: eventCreatorId }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

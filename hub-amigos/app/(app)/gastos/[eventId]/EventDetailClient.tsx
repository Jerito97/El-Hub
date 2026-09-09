"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PayModal, type DebtRow, type OwedRow } from "@/components/PayModal";
import { BalanceModal, type PaymentLog } from "@/components/BalanceModal";
import { ExpenseModal, type ExpenseModalInitial } from "@/components/ExpenseModal";
import { EventModal } from "@/components/EventModal";
import { closeEvent, removeGuest } from "@/lib/actions/events";
import { money, avatarColor } from "@/lib/format";
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

export interface RealParticipantView {
  id: string;
  name: string;
  shares: number;
}

export interface GuestView {
  id: string;
  name: string;
  shares: number;
  /** Who they actually owe, per the same debt-simplification as the rest of the event (usually one person). */
  owedTo: { id: string; name: string; alias: string; amount: number }[];
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
  participantShares,
  realParticipants,
  guests,
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
  participants: { id: string; name: string; isGuest: boolean }[];
  participantShares: Record<string, number>;
  realParticipants: RealParticipantView[];
  guests: GuestView[];
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
  const [copiedGuestId, setCopiedGuestId] = useState<string | null>(null);
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);

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

  async function copyGuestMessage(g: GuestView) {
    const text =
      g.owedTo.length === 0
        ? `Hola ${g.name}, estás al día en "${eventName}".`
        : g.owedTo
            .map((o) => `Hola ${g.name}, debés ${money(o.amount)} a ${o.name}. Su alias es ${o.alias || "(sin alias cargado)"}.`)
            .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedGuestId(g.id);
      setTimeout(() => setCopiedGuestId((c) => (c === g.id ? null : c)), 1800);
    } catch {
      // clipboard unavailable -- ignore
    }
  }

  async function doRemoveGuest(guestId: string) {
    setBusy(true);
    await removeGuest(guestId);
    setBusy(false);
    setRemoveConfirmId(null);
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
        <div style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8, background: "var(--color-neutral-200)", borderRadius: "var(--radius-pill)", padding: "9px 14px" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-neutral-600)" }} />
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "11.5px", letterSpacing: ".04em", color: "var(--color-neutral-700)" }}>Evento cerrado</span>
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
              <button type="button" className="btn btn-block" disabled style={{ marginTop: 8, background: "var(--color-neutral-200)", color: "var(--color-neutral-500)" }}>
                Cerrar evento
              </button>
              <div style={{ marginTop: 6, fontSize: 12, color: "var(--color-neutral-600)" }}>No se puede cerrar con deudas sin saldar.</div>
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: 24 }}>
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>Participantes</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        {realParticipants.map((p) => {
          const c = avatarColor(p.id);
          return (
            <span key={p.id} style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--color-surface)", boxShadow: "var(--shadow-card)", borderRadius: "var(--radius-pill)", padding: "6px 12px 6px 6px", fontSize: 12.5, fontWeight: 700 }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", flex: "none", background: c.bg, color: c.fg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 10 }}>
                {p.name.slice(0, 1).toUpperCase()}
              </span>
              {p.name}
              {p.id === meId && <span style={{ color: "var(--color-neutral-600)" }}>(vos)</span>}
              {p.shares > 1 && <span className="tag tag-solid">×{p.shares}</span>}
            </span>
          );
        })}
      </div>

      {guests.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {guests.map((g) => (
            <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--color-surface)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "14.5px" }}>
                  {g.name}
                  <span className="tag tag-muted">Invitado</span>
                  {g.shares > 1 && <span className="tag tag-solid">×{g.shares}</span>}
                </div>
                <div style={{ fontSize: 12, color: "var(--color-neutral-700)", marginTop: 2 }}>
                  {g.owedTo.length === 0 ? "Sin deuda pendiente" : g.owedTo.map((o) => `debe ${money(o.amount)} a ${o.name}`).join(" · ")}
                </div>
              </div>

              <button type="button" title="Copiar mensaje" className="tap-icon" onClick={() => copyGuestMessage(g)}>
                {copiedGuestId === g.id ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5"></path>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="11" height="11"></rect>
                    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"></path>
                  </svg>
                )}
              </button>

              {!eventIsClosed &&
                (removeConfirmId === g.id ? (
                  <button type="button" disabled={busy} onClick={() => doRemoveGuest(g.id)} style={{ flex: "none", background: "var(--color-accent-600)", color: "#fff", border: 0, borderRadius: "var(--radius-pill)", padding: "8px 12px", cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 11.5 }}>
                    ¿Seguro?
                  </button>
                ) : (
                  <button type="button" title="Quitar invitado" className="tap-icon" onClick={() => setRemoveConfirmId(g.id)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18M6 6l12 12"></path>
                    </svg>
                  </button>
                ))}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>Gastos</span>
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 17 }}>{money(eventTotal)}</span>
      </div>

      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {eventExpenses.map((x) => {
          const c = avatarColor(x.payerId);
          return (
            <div key={x.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 14px", background: "var(--color-surface)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)" }}>
              <div style={{ width: 38, height: 38, flex: "none", borderRadius: "50%", background: c.bg, color: c.fg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 12 }}>{x.payerInitials}</div>
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
          );
        })}
      </div>

      {modal === "pay" && <PayModal eventId={eventId} myDebts={myDebts} owedToMe={owedToMe} onClose={() => setModal(null)} />}
      {modal === "balance" && <BalanceModal settlements={settlements} payments={payments} onClose={() => setModal(null)} />}
      {modal === "expense" && (
        <ExpenseModal
          eventId={eventId}
          meId={meId}
          participants={participants}
          participantShares={participantShares}
          initial={editingExpense ?? undefined}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "event" && (
        <EventModal
          meId={meId}
          users={allUsers}
          initial={{
            id: eventId,
            name: eventName,
            participantIds: realParticipants.map((p) => p.id),
            participantShares,
            creatorId: eventCreatorId,
          }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

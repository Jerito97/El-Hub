"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { editExpense, saveExpense } from "@/lib/actions/events";
import { money } from "@/lib/format";

export interface ExpenseModalInitial {
  id: string;
  desc: string;
  amount: number;
  payerId: string;
  shareIds: string[];
}

export function ExpenseModal({
  eventId,
  meId,
  participants,
  participantShares,
  initial,
  onClose,
}: {
  eventId: string;
  meId: string;
  participants: { id: string; name: string; isGuest: boolean }[];
  participantShares: Record<string, number>;
  initial?: ExpenseModalInitial;
  onClose: () => void;
}) {
  const router = useRouter();
  const isEditing = !!initial;
  const [desc, setDesc] = useState(initial?.desc ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [payer, setPayer] = useState(initial?.payerId ?? meId);
  const [shares, setShares] = useState<string[]>(initial?.shareIds ?? participants.map((p) => p.id));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggleShare(id: string) {
    setShares((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.concat(id)));
  }

  const amt = parseFloat(amount.replace(/[^\d.]/g, "")) || 0;
  const realPayers = participants.filter((p) => !p.isGuest);
  const totalCuotas = shares.reduce((sum, id) => sum + (participantShares[id] ?? 1), 0);

  async function submit() {
    setBusy(true);
    setError(null);
    const res = isEditing ? await editExpense(initial.id, desc, amt, payer, shares) : await saveExpense(eventId, desc, amt, payer, shares);
    setBusy(false);
    if (!res.ok) return setError(res.error || "Algo salió mal");
    router.refresh();
    onClose();
  }

  return (
    <Sheet title={isEditing ? "Editar gasto" : "Cargar gasto"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="field">
          <label className="field-label">Descripción</label>
          <input className="input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ej: Nafta" />
        </div>
        <div className="field">
          <label className="field-label">Monto</label>
          <input className="input" style={{ fontSize: 20 }} value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" placeholder="0" />
        </div>
        <div>
          <div className="field-label">¿Quién pagó?</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 9 }}>
            {realPayers.map((p) => {
              const on = payer === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPayer(p.id)}
                  style={{ background: on ? "var(--color-accent)" : "transparent", color: on ? "#fff" : "var(--color-text)", border: "2px solid var(--color-text)", padding: "9px 12px", cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 13 }}
                >
                  {p.name}
                  {p.id === meId ? " (vos)" : ""}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="field-label">¿Entre quiénes se divide?</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 9 }}>
            {participants.map((p) => {
              const on = shares.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleShare(p.id)}
                  style={{ display: "flex", alignItems: "center", gap: 8, background: on ? "var(--color-text)" : "transparent", color: on ? "var(--color-bg)" : "var(--color-text)", border: "2px solid var(--color-text)", padding: "9px 12px", cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 13 }}
                >
                  <span style={{ width: 10, height: 10, background: on ? "var(--color-accent)" : "var(--color-neutral-400)" }} />
                  {p.name}
                  {p.isGuest && <span className="tag tag-muted">Invitado</span>}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 10, fontSize: "12.5px", color: "var(--color-neutral-700)" }}>
            {shares.length && amt ? `${money(amt / totalCuotas)} por cuota · ${totalCuotas} cuotas entre ${shares.length} personas` : "Elegí al menos una persona y un monto."}
          </div>
        </div>
        {error && <div style={{ fontSize: "12.5px", color: "var(--color-accent-700)" }}>{error}</div>}
        <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={submit}>
          {isEditing ? "Guardar cambios" : "Guardar gasto"}
        </button>
      </div>
    </Sheet>
  );
}

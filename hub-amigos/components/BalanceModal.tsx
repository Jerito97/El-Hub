"use client";

import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { undoPaid } from "@/lib/actions/events";
import { money } from "@/lib/format";
import type { Settlement } from "@/lib/domain";

export interface PaymentLog {
  id: string;
  from: string;
  to: string;
  amount: number;
}

export function BalanceModal({ settlements, payments, onClose }: { settlements: Settlement[]; payments: PaymentLog[]; onClose: () => void }) {
  const router = useRouter();

  async function undo(id: string) {
    await undoPaid(id);
    router.refresh();
  }

  return (
    <Sheet title="Balance del evento" dark onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {settlements.map((b, i) => (
          <div key={i} style={{ padding: "13px 14px", background: "rgba(255,255,255,.06)", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "14.5px" }}>
                {b.from}
                {b.fromIsGuest && <span className="tag tag-muted">Invitado</span>}
              </span>
              <span style={{ color: "var(--color-accent-400)", fontSize: 15 }}>→</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "14.5px", flex: 1 }}>
                {b.to}
                {b.toIsGuest && <span className="tag tag-muted">Invitado</span>}
              </span>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, color: "var(--color-accent-400)" }}>{money(b.amount)}</span>
            </div>
          </div>
        ))}
        {settlements.length === 0 && <div style={{ padding: "12px 0", fontSize: 13, opacity: 0.75 }}>No hay deudas pendientes.</div>}
      </div>

      {payments.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "10.5px", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--color-neutral-400)", marginBottom: 8 }}>Pagos registrados</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {payments.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(255,255,255,.06)", borderRadius: "var(--radius-md)" }}>
                <span style={{ flex: 1, fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "13.5px" }}>
                  {p.from} → {p.to}
                </span>
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: "13.5px" }}>{money(p.amount)}</span>
                <button type="button" onClick={() => undo(p.id)} style={{ background: "rgba(255,255,255,.12)", border: 0, borderRadius: "var(--radius-pill)", color: "var(--color-bg)", padding: "6px 11px", cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "10.5px" }}>
                  Deshacer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  );
}

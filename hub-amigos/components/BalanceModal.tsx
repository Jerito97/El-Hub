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
      <div style={{ display: "flex", flexDirection: "column" }}>
        {settlements.map((b, i) => (
          <div key={i} style={{ padding: "12px 0", borderTop: "1px solid var(--color-neutral-700)", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "14.5px" }}>{b.from}</span>
              <span style={{ color: "var(--color-accent-400)", fontSize: 15 }}>→</span>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "14.5px", flex: 1 }}>{b.to}</span>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, color: "var(--color-accent-400)" }}>{money(b.amount)}</span>
            </div>
          </div>
        ))}
        {settlements.length === 0 && <div style={{ padding: "12px 0", fontSize: 13, opacity: 0.75 }}>No hay deudas pendientes.</div>}
      </div>

      {payments.length > 0 && (
        <div style={{ marginTop: 18, borderTop: "2px solid var(--color-neutral-700)", paddingTop: 12 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "10.5px", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--color-neutral-400)" }}>Pagos registrados</div>
          {payments.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--color-neutral-700)" }}>
              <span style={{ flex: 1, fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "13.5px" }}>
                {p.from} → {p.to}
              </span>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: "13.5px" }}>{money(p.amount)}</span>
              <button type="button" onClick={() => undo(p.id)} style={{ background: "transparent", border: "1px solid var(--color-neutral-600)", color: "var(--color-bg)", padding: "5px 9px", cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "10.5px" }}>
                Deshacer
              </button>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}

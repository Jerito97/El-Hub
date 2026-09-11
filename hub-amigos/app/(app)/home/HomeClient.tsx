"use client";

// Lower half of the Home screen: the same people-list data as Fechas
// (already sorted by days-until), filtered to "Esta semana" / "Este mes".

import { useState } from "react";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { Chip } from "@/components/ui/Chip";
import type { PersonView } from "@/lib/domain";

export function HomeClient({ people }: { people: PersonView[] }) {
  const [range, setRange] = useState<"semana" | "mes">("semana");
  const max = range === "semana" ? 7 : 31;
  const list = people.filter((p) => p.days > 0 && p.days <= max);

  return (
    <>
      <div style={{ marginTop: 26 }}>
        <SegmentedToggle options={[{ value: "semana", label: "Esta semana" }, { value: "mes", label: "Este mes" }]} value={range} onChange={(v) => setRange(v as "semana" | "mes")} />
      </div>
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {list.length === 0 && (
          <div style={{ padding: "20px 2px", fontSize: 13, color: "var(--color-neutral-700)" }}>
            {range === "semana" ? "Ninguna fecha esta semana." : "Ninguna fecha en los próximos 31 días."}
          </div>
        )}
        {list.map((p) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--color-surface)", borderRadius: "var(--radius-md)", padding: "10px 12px", boxShadow: "var(--shadow-card)" }}>
            <Chip initials={p.initials} isAniv={p.isAniv} size="sm" bg={p.chipBg} fg={p.chipFg} />
            <div style={{ flex: 1, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15 }}>{p.name}</div>
            <div style={{ flex: "none", background: "var(--color-peach-bg)", borderRadius: "var(--radius-sm)", padding: "5px 10px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 14, color: "var(--color-accent)", lineHeight: 1 }}>{p.days}</div>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: ".04em", color: "var(--color-peach-ink)", textTransform: "uppercase" }}>días</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

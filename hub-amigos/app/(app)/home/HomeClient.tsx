"use client";

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
      <div className="seg2" style={{ marginTop: 26 }}>
        <SegmentedToggle options={[{ value: "semana", label: "Esta semana" }, { value: "mes", label: "Este mes" }]} value={range} onChange={(v) => setRange(v as "semana" | "mes")} />
      </div>
      <div style={{ marginTop: 14, borderTop: "2px solid var(--color-divider)" }}>
        {list.length === 0 && (
          <div style={{ padding: "20px 2px", fontSize: 13, color: "var(--color-neutral-700)" }}>
            {range === "semana" ? "Ninguna fecha esta semana." : "Ninguna fecha en los próximos 31 días."}
          </div>
        )}
        {list.map((p) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 2px", borderBottom: "1px solid var(--color-neutral-300)" }}>
            <Chip initials={p.initials} isAniv={p.isAniv} size="sm" bg={p.chipBg} fg={p.chipFg} />
            <div style={{ flex: 1, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15 }}>{p.name}</div>
            <div style={{ fontSize: "12.5px", color: "var(--color-accent-700)", fontWeight: 600 }}>{p.daysLabel}</div>
          </div>
        ))}
      </div>
    </>
  );
}

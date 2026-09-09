"use client";

export function Stepper({ value, onChange, min = 1, max = 9 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", background: "var(--color-neutral-100)", borderRadius: "var(--radius-pill)", padding: 3 }}>
      <button
        type="button"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{ width: 26, height: 26, borderRadius: "50%", flex: "none", background: "#fff", border: 0, cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, color: value <= min ? "var(--color-neutral-400)" : "var(--color-text)" }}
      >
        −
      </button>
      <span style={{ width: 28, textAlign: "center", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 13 }}>{value}</span>
      <button
        type="button"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{ width: 26, height: 26, borderRadius: "50%", flex: "none", background: "#fff", border: 0, cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, color: value >= max ? "var(--color-neutral-400)" : "var(--color-text)" }}
      >
        +
      </button>
    </div>
  );
}

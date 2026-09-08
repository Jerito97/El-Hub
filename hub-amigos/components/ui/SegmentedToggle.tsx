"use client";

export interface SegOption {
  value: string;
  label: string;
}

export function SegmentedToggle({
  options,
  value,
  onChange,
  top = false,
}: {
  options: SegOption[];
  value: string;
  onChange: (v: string) => void;
  /** top=true renders the 3-column "tab bar" border style (top-only rule). */
  top?: boolean;
}) {
  return (
    <div className={top ? "seg3" : "seg2"} style={top ? { gridTemplateColumns: `repeat(${options.length}, 1fr)` } : undefined}>
      {options.map((o) => (
        <button key={o.value} type="button" className={`seg-btn${o.value === value ? " active" : ""}`} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

"use client";

export function Switch({
  on,
  onToggle,
  variant = "accent",
}: {
  on: boolean;
  onToggle: () => void;
  variant?: "accent" | "outline";
}) {
  const cls = variant === "outline" ? "switch switch-outline" : "switch";
  return (
    <button type="button" className={`${cls}${on ? " on" : ""}`} style={{ justifyContent: on ? "flex-end" : "flex-start" }} onClick={onToggle} aria-pressed={on}>
      <span className="switch-knob" />
    </button>
  );
}

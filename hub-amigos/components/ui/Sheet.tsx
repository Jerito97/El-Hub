"use client";

export function Sheet({
  title,
  dark,
  onClose,
  children,
}: {
  title: string;
  dark?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overlay" style={{ display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div className={`sheet${dark ? " sheet-dark" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, borderRadius: 3, background: dark ? "var(--color-neutral-700)" : "var(--color-neutral-300)", margin: "0 auto 12px" }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <h2 style={{ fontSize: 25 }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              flex: "none",
              background: dark ? "color-mix(in srgb, #fff 12%, transparent)" : "var(--color-neutral-200)",
              border: 0,
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "inherit",
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ marginTop: 20 }}>{children}</div>
      </div>
    </div>
  );
}

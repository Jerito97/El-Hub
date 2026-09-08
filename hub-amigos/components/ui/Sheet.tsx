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
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <h2 style={{ fontSize: 25 }}>{title}</h2>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: 0, fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "2px 4px", color: "inherit" }}>
            ✕
          </button>
        </div>
        <div style={{ marginTop: 20 }}>{children}</div>
      </div>
    </div>
  );
}

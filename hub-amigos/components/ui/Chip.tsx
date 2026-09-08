export function AnniversaryIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx="9" cy="14" r="6" />
      <circle cx="15" cy="9" r="6" />
    </svg>
  );
}

export function Chip({
  initials,
  isAniv,
  size = "sm",
  bg,
  fg,
}: {
  initials: string;
  isAniv?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  bg: string;
  fg: string;
}) {
  const sizePx = { xs: 24, sm: 34, md: 38, lg: 44 }[size];
  return (
    <span className={`chip chip-${size}`} style={{ background: bg, color: fg }}>
      {isAniv ? <AnniversaryIcon size={Math.round(sizePx * 0.45)} /> : initials}
    </span>
  );
}

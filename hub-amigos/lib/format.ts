export const money = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

export const pad = (n: number) => String(n).padStart(2, "0");

export const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const dateLabel = (day: number, month: number, year: number) => `${pad(day)}/${pad(month)}/${year}`;

const AVATAR_PALETTE: { bg: string; fg: string }[] = [
  { bg: "#bf2e18", fg: "#ffffff" }, // brand red
  { bg: "#201e1d", fg: "#ffffff" }, // ink
  { bg: "#f4a672", fg: "#4a2c0f" }, // peach
  { bg: "#8b6fd9", fg: "#ffffff" }, // purple
  { bg: "#3fa77a", fg: "#ffffff" }, // green
  { bg: "#4f8ff7", fg: "#ffffff" }, // blue
];

/** Deterministic per-id avatar color, so the same person always gets the same color everywhere. */
export function avatarColor(id: string): { bg: string; fg: string } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

const APP_TZ = "America/Argentina/Buenos_Aires";

/**
 * "Now" as the group's local (Argentina) wall-clock time, read via its
 * getFullYear/getMonth/getDate/getDay/etc. Needed because this runs
 * server-side (Vercel functions default to UTC), so a plain `new Date()`
 * can already be "tomorrow" for anyone here once it's past 21:00 local time.
 */
export function nowInAppTz(): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return new Date(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
}

/** Days from `today` (local midnight) until the next occurrence of month/day. */
export function daysUntil(month: number, day: number, today: Date): number {
  const y = today.getFullYear();
  let t = new Date(y, month - 1, day);
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (t < t0) t = new Date(y + 1, month - 1, day);
  return Math.round((t.getTime() - t0.getTime()) / 86400000);
}

export const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export const MONTHS_LONG = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
export const WEEKDAYS_MON_FIRST = ["L", "M", "M", "J", "V", "S", "D"];

const WEEKDAYS_LONG = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

/** e.g. "Lunes 7 de septiembre" */
export function todayLabel(date: Date): string {
  const weekday = WEEKDAYS_LONG[date.getDay()];
  const month = MONTHS_LONG[date.getMonth()].toLowerCase();
  return `${weekday} ${date.getDate()} de ${month}`;
}

/**
 * Checks a day/month/year picked via three separate <select>s: all three
 * present, and the day actually exists in that month/year (handles
 * different month lengths and leap years). Returns a user-facing error
 * message, or null when the date is valid.
 */
export function validateDate(day: number, month: number, year: number, missingMsg = "Elegí día, mes y año"): string | null {
  if (!day || !month || !year) return missingMsg;
  if (day > new Date(year, month, 0).getDate()) return "Esa fecha no existe";
  return null;
}

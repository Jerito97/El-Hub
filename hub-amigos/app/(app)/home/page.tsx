import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getFullState } from "@/lib/data";
import { computePeople } from "@/lib/domain";
import { nowInAppTz, todayLabel } from "@/lib/format";
import { HomeClient } from "./HomeClient";

export default async function HomePage() {
  const me = (await getCurrentUser())!;
  const state = await getFullState(me.id);
  const today = nowInAppTz();
  const people = computePeople(state.people, state.users, me.id, today);
  const todayBirthdays = people.filter((p) => p.isToday);

  return (
    <div style={{ padding: "24px 18px 30px" }}>
      <h1 style={{ fontSize: 34, lineHeight: 1.02 }}>Hola, {me.name}.</h1>
      <div style={{ marginTop: 6, fontSize: "13.5px", color: "var(--color-neutral-700)" }}>{todayLabel(today)}</div>

      {todayBirthdays.length > 0 && (
        <div style={{ marginTop: 20, background: "var(--color-accent-600)", color: "#fff", padding: "20px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase" }}>Hoy cumple</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 40, lineHeight: 1 }}>{todayBirthdays[0].name}</div>
        </div>
      )}

      <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Link
          href="/fechas"
          style={{ textAlign: "left", background: "var(--color-neutral-100)", border: "2px solid var(--color-text)", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12, minHeight: 158 }}
        >
          <span style={{ width: 34, height: 34, background: "var(--color-accent-600)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </span>
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "10.5px", letterSpacing: ".13em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Fechas</span>
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 19, lineHeight: 1.1 }}>Ver próximas fechas</span>
          <span style={{ marginTop: "auto", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 17, color: "var(--color-accent-700)" }}>→</span>
        </Link>
        <Link
          href="/gastos"
          style={{ textAlign: "left", background: "var(--color-neutral-100)", border: "2px solid var(--color-text)", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12, minHeight: 158 }}
        >
          <span style={{ width: 34, height: 34, background: "var(--color-accent-600)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="6" rx="8" ry="3"></ellipse>
              <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"></path>
              <path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"></path>
            </svg>
          </span>
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "10.5px", letterSpacing: ".13em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>Gastos</span>
          <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 19, lineHeight: 1.1 }}>Ver gastos del mes</span>
          <span style={{ marginTop: "auto", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 17, color: "var(--color-accent-700)" }}>→</span>
        </Link>
      </div>

      <HomeClient people={people} />
    </div>
  );
}

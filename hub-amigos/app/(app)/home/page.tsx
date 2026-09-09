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
    <div style={{ padding: "10px 18px 30px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -46, right: -60, width: 170, height: 130, background: "var(--color-accent)", borderRadius: "0 0 0 120px", opacity: 0.12, zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 14, color: "var(--color-neutral-600)", fontWeight: 600 }}>Hola,</div>
        <div style={{ position: "relative", display: "inline-block", marginTop: 2 }}>
          <h1 style={{ fontSize: 38, lineHeight: 1 }}>{me.name}.</h1>
          <svg width="70" height="10" viewBox="0 0 70 10" style={{ position: "absolute", left: 2, bottom: -8 }}>
            <path d="M2 7 C 20 2, 50 2, 68 7" stroke="var(--color-accent)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <div style={{ marginTop: 16, fontSize: "13.5px", color: "var(--color-neutral-600)", fontWeight: 600 }}>Hoy es {todayLabel(today)}</div>
      </div>

      {todayBirthdays.length > 0 && (
        <div style={{ position: "relative", zIndex: 1, marginTop: 20, background: "var(--color-accent)", color: "#fff", borderRadius: "var(--radius-lg)", padding: "20px 18px", display: "flex", flexDirection: "column", gap: 6, boxShadow: "0 10px 24px color-mix(in srgb, var(--color-accent) 35%, transparent)" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", opacity: 0.85 }}>Hoy cumple</div>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 36, lineHeight: 1 }}>{todayBirthdays[0].name}</div>
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1, marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Link
          href="/fechas"
          style={{ textAlign: "left", background: "var(--color-peach-bg)", borderRadius: "var(--radius-lg)", padding: "16px", display: "flex", flexDirection: "column", gap: 22, minHeight: 158 }}
        >
          <span style={{ width: 42, height: 42, borderRadius: "var(--radius-sm)", background: "var(--color-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </span>
          <span>
            <span style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "10.5px", letterSpacing: ".07em", textTransform: "uppercase", color: "var(--color-peach-ink)" }}>Fechas</span>
            <span style={{ display: "block", marginTop: 4, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 17, lineHeight: 1.15 }}>Ver próximas fechas</span>
          </span>
          <span style={{ marginTop: "auto", alignSelf: "flex-end", width: 34, height: 34, borderRadius: "50%", background: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
          </span>
        </Link>
        <Link
          href="/gastos"
          style={{ textAlign: "left", background: "var(--color-lavender-bg)", borderRadius: "var(--radius-lg)", padding: "16px", display: "flex", flexDirection: "column", gap: 22, minHeight: 158 }}
        >
          <span style={{ width: 42, height: 42, borderRadius: "var(--radius-sm)", background: "var(--color-lavender-ink)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="6" rx="8" ry="3"></ellipse>
              <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"></path>
              <path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"></path>
            </svg>
          </span>
          <span>
            <span style={{ display: "block", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "10.5px", letterSpacing: ".07em", textTransform: "uppercase", color: "var(--color-lavender-ink)" }}>Gastos</span>
            <span style={{ display: "block", marginTop: 4, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 17, lineHeight: 1.15 }}>Ver gastos del mes</span>
          </span>
          <span style={{ marginTop: "auto", alignSelf: "flex-end", width: 34, height: 34, borderRadius: "50%", background: "var(--color-lavender-ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>
          </span>
        </Link>
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <HomeClient people={people} />
      </div>
    </div>
  );
}

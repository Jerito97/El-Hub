import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getFullState } from "@/lib/data";
import { dateLabel, initialsOf } from "@/lib/format";

export default async function PersonasPage() {
  const me = (await getCurrentUser())!;
  const state = await getFullState(me.id);

  return (
    <div style={{ padding: "22px 18px 30px" }}>
      <h1 style={{ fontSize: 32 }}>Personas</h1>
      <div style={{ marginTop: 6, fontSize: 13, color: "var(--color-neutral-700)" }}>Usuarios registrados en el hub</div>
      <div style={{ marginTop: 16, borderTop: "2px solid var(--color-divider)" }}>
        {state.users.map((u) => {
          const person = state.people.find((p) => p.user_id === u.id);
          const meta = (person ? dateLabel(person.day, person.month, person.year) : "sin cumpleaños cargado") + (u.alias ? ` · ${u.alias}` : "");
          return (
            <Link key={u.id} href={`/personas/${u.id}`} style={{ display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--color-neutral-300)", padding: "14px 2px" }}>
              <span style={{ width: 42, height: 42, flex: "none", background: "var(--color-accent-600)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 14 }}>{initialsOf(u.name)}</span>
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 17 }}>{u.name}</span>
                  {u.id === me.id && <span className="tag tag-muted">vos</span>}
                </span>
                <span style={{ fontSize: 12, color: "var(--color-neutral-700)" }}>{meta}</span>
              </span>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 15, color: "var(--color-neutral-500)" }}>→</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

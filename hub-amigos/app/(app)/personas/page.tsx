import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getFullState } from "@/lib/data";
import { dateLabel, initialsOf, avatarColor } from "@/lib/format";

export default async function PersonasPage() {
  const me = (await getCurrentUser())!;
  const state = await getFullState(me.id);

  return (
    <div style={{ padding: "22px 18px 30px" }}>
      <h1 style={{ fontSize: 32 }}>Personas</h1>
      <div style={{ marginTop: 6, fontSize: 13, color: "var(--color-neutral-700)" }}>Usuarios registrados en LinkUp</div>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        {state.users.filter((u) => !u.is_guest).map((u) => {
          const person = state.people.find((p) => p.user_id === u.id);
          const meta = (person ? dateLabel(person.day, person.month, person.year) : "sin cumpleaños cargado") + (u.alias ? ` · ${u.alias}` : "");
          const c = avatarColor(u.id);
          return (
            <Link key={u.id} href={`/personas/${u.id}`} style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)", padding: "13px 14px" }}>
              <span style={{ width: 42, height: 42, borderRadius: "50%", flex: "none", background: c.bg, color: c.fg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 14 }}>{initialsOf(u.name)}</span>
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

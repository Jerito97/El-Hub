"use client";

import { useMemo, useState } from "react";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { Chip } from "@/components/ui/Chip";
import { PersonModal, type PersonModalInitial } from "@/components/PersonModal";
import { MONTHS_LONG, WEEKDAYS_MON_FIRST, initialsOf } from "@/lib/format";
import type { PersonView } from "@/lib/domain";

export function FechasClient({ people, today }: { people: PersonView[]; today: { day: number; month: number; year: number } }) {
  const [view, setView] = useState<"lista" | "calendario">("lista");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<PersonModalInitial | null>(null);
  const [calMonth, setCalMonth] = useState(today.month - 1);
  const [calYear, setCalYear] = useState(today.year);

  const filtered = search.trim() ? people.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase())) : people;

  function openAdd() {
    setModal({ name: "", kind: "cumple", day: "", month: "", year: "", isPrivate: false, remind: true });
  }
  function openEdit(p: PersonView) {
    setModal({ id: p.id, name: p.name, kind: p.kind, day: String(p.day), month: String(p.month), year: String(p.year), isPrivate: p.isPrivate, remind: p.remind });
  }

  function calPrev() {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else setCalMonth((m) => m - 1);
  }
  function calNext() {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else setCalMonth((m) => m + 1);
  }

  const cells = useMemo(() => {
    const lead = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;
    const total = new Date(calYear, calMonth + 1, 0).getDate();
    const out: Array<null | { day: number; isToday: boolean; matches: PersonView[] }> = [];
    for (let i = 0; i < lead; i++) out.push(null);
    for (let d = 1; d <= total; d++) {
      const matches = people.filter((p) => p.month === calMonth + 1 && p.day === d);
      const isToday = calYear === today.year && calMonth === today.month - 1 && d === today.day;
      out.push({ day: d, isToday, matches });
    }
    return out;
  }, [people, calMonth, calYear, today]);

  const monthPeople = useMemo(() => people.filter((p) => p.month === calMonth + 1).sort((a, b) => a.day - b.day), [people, calMonth]);

  return (
    <div style={{ padding: "22px 18px 30px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontSize: 32 }}>Fechas</h1>
        <button type="button" className="btn btn-primary" style={{ padding: "10px 13px", fontSize: 13 }} onClick={openAdd}>
          + Agregar
        </button>
      </div>

      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "11.5px", color: "var(--color-neutral-700)" }}>
          <span style={{ width: 12, height: 12, background: "var(--color-accent-600)" }} />
          Cumpleaños
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "11.5px", color: "var(--color-neutral-700)" }}>
          <span style={{ width: 16, height: 16, background: "var(--color-text)", color: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round">
              <circle cx="9" cy="14" r="6" />
              <circle cx="15" cy="9" r="6" />
            </svg>
          </span>
          Aniversarios
        </span>
      </div>

      <div className="seg2" style={{ marginTop: 14 }}>
        <SegmentedToggle options={[{ value: "lista", label: "Lista" }, { value: "calendario", label: "Calendario" }]} value={view} onChange={(v) => setView(v as "lista" | "calendario")} />
      </div>

      {view === "calendario" ? (
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid var(--color-divider)", paddingBottom: 10 }}>
            <button type="button" onClick={calPrev} style={{ background: "transparent", border: 0, cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 16, padding: "2px 6px" }}>
              ←
            </button>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 17 }}>
              {MONTHS_LONG[calMonth]} {calYear}
            </div>
            <button type="button" onClick={calNext} style={{ background: "transparent", border: 0, cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 16, padding: "2px 6px" }}>
              →
            </button>
          </div>

          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1 }}>
            {WEEKDAYS_MON_FIRST.map((w, i) => (
              <div key={i} style={{ textAlign: "center", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 10, letterSpacing: ".06em", color: "var(--color-neutral-600)", paddingBottom: 4 }}>
                {w}
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1, background: "var(--color-neutral-300)", border: "1px solid var(--color-neutral-300)" }}>
            {cells.map((c, i) => (
              <div key={i} style={{ minHeight: 46, background: "var(--color-bg)", display: "flex", flexDirection: "column", padding: "3px 4px", gap: 2 }}>
                {c && (
                  <>
                    {c.isToday ? (
                      <div style={{ alignSelf: "flex-start", background: "var(--color-text)", color: "var(--color-bg)", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "10.5px", padding: "1px 4px" }}>{c.day}</div>
                    ) : (
                      <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "10.5px", color: "var(--color-neutral-600)" }}>{c.day}</div>
                    )}
                    {c.matches.length > 0 && (
                      <div
                        style={{
                          marginTop: "auto",
                          background: c.matches.every((p) => p.isAniv) ? "var(--color-text)" : "var(--color-accent-600)",
                          color: c.matches.every((p) => p.isAniv) ? "var(--color-bg)" : "#fff",
                          fontFamily: "var(--font-heading)",
                          fontWeight: 800,
                          fontSize: 10,
                          padding: "2px 3px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {c.matches.length > 1 ? `${c.matches.length}×` : c.matches[0].isAniv ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
                            <circle cx="9" cy="14" r="6" />
                            <circle cx="15" cy="9" r="6" />
                          </svg>
                        ) : (
                          initialsOf(c.matches[0].name)
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>Este mes</div>
          <div style={{ marginTop: 8, borderTop: "2px solid var(--color-divider)" }}>
            {monthPeople.length === 0 && <div style={{ padding: "20px 2px", fontSize: 13, color: "var(--color-neutral-700)" }}>Sin fechas este mes.</div>}
            {monthPeople.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 2px", borderBottom: "1px solid var(--color-neutral-300)" }}>
                <Chip initials={p.initials} isAniv={p.isAniv} size="sm" bg={p.chipBg} fg={p.chipFg} />
                <div style={{ flex: 1, fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "15.5px" }}>{p.name}</div>
                <div style={{ textAlign: "right", fontSize: "12.5px", color: "var(--color-neutral-700)" }}>
                  {p.dateLabel}
                  <br />
                  {p.ageLabel}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div style={{ marginTop: 12, display: "flex", alignItems: "stretch", border: "2px solid var(--color-text)" }}>
            <input className="input" style={{ border: 0 }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre" />
            {search && (
              <button type="button" onClick={() => setSearch("")} style={{ flex: "none", background: "transparent", border: 0, borderLeft: "2px solid var(--color-text)", padding: "0 13px", cursor: "pointer", fontSize: 15, color: "var(--color-neutral-700)" }}>
                ✕
              </button>
            )}
          </div>
          <div style={{ marginTop: 12, borderBottom: "2px solid var(--color-divider)" }} />
          {search.trim() && filtered.length === 0 && <div style={{ padding: "22px 2px", fontSize: 13, color: "var(--color-neutral-700)" }}>Nadie con ese nombre.</div>}

          {filtered.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 13, padding: "15px 2px", borderBottom: "1px solid var(--color-neutral-300)" }}>
              <Chip initials={p.initials} isAniv={p.isAniv} size="lg" bg={p.chipBg} fg={p.chipFg} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 17 }}>{p.name}</span>
                  {p.isMe && <span className="tag tag-muted">vos</span>}
                  {p.isPrivate && <span className="tag tag-solid">privado</span>}
                </div>
                <div style={{ fontSize: "12.5px", color: "var(--color-neutral-700)" }}>
                  {p.dateLabel} · {p.ageLabel}
                </div>
              </div>
              {p.canEdit && (
                <button type="button" title="Editar" className="tap-icon" onClick={() => openEdit(p)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                  </svg>
                </button>
              )}
              <div style={{ textAlign: "right", flex: "none" }}>
                {p.isToday ? (
                  <div style={{ background: "var(--color-accent-600)", color: "#fff", fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 12, letterSpacing: ".08em", padding: "6px 9px" }}>¡HOY!</div>
                ) : (
                  <div>
                    <div style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 22, lineHeight: 1 }}>{p.days}</div>
                    <div style={{ fontSize: "10.5px", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>días</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <PersonModal initial={modal} onClose={() => setModal(null)} />}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { PersonModal, type PersonModalInitial } from "@/components/PersonModal";
import { dateLabel, initialsOf, money, avatarColor } from "@/lib/format";
import { settleFor } from "@/lib/domain";
import { adminCloseEvent, adminDeleteEvent, adminDeleteExpense, adminDeleteUser, adminReopenEvent, adminResetPin } from "@/lib/actions/admin";
import type { EventRow, PersonRow, UserRow } from "@/lib/types";

type Tab = "usuarios" | "fechas" | "eventos";

export function AdminClient({ meId, users, people, events }: { meId: string; users: UserRow[]; people: PersonRow[]; events: EventRow[] }) {
  const [tab, setTab] = useState<Tab>("usuarios");

  return (
    <div style={{ padding: "22px 18px 30px" }}>
      <h1 style={{ fontSize: 32 }}>Admin</h1>
      <div style={{ marginTop: 6, fontSize: 13, color: "var(--color-neutral-700)" }}>Gestión del grupo — usá esto con cuidado, la mayoría de las acciones no se pueden deshacer.</div>

      <div style={{ marginTop: 14 }}>
        <SegmentedToggle
          options={[
            { value: "usuarios", label: "Usuarios" },
            { value: "fechas", label: "Fechas" },
            { value: "eventos", label: "Eventos" },
          ]}
          value={tab}
          onChange={(v) => setTab(v as Tab)}
        />
      </div>

      {tab === "usuarios" && <UsersTab meId={meId} users={users.filter((u) => !u.is_guest)} />}
      {tab === "fechas" && <FechasTab people={people} users={users} />}
      {tab === "eventos" && <EventosTab events={events} users={users} />}
    </div>
  );
}

function userName(users: UserRow[], id: string | null) {
  return users.find((u) => u.id === id)?.name ?? "?";
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: "14px", background: "var(--color-surface)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>;
}

/* ————— Usuarios ————— */

function UsersTab({ meId, users }: { meId: string; users: UserRow[] }) {
  const router = useRouter();
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [mode, setMode] = useState<"pin" | "delete" | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function openTool(userId: string, m: "pin" | "delete") {
    setOpenFor(userId);
    setMode(m);
    setPin("");
    setError(null);
  }
  function close() {
    setOpenFor(null);
    setMode(null);
  }

  async function doResetPin(userId: string) {
    setBusy(true);
    setError(null);
    const res = await adminResetPin(userId, pin);
    setBusy(false);
    if (!res.ok) return setError(res.error || "Algo salió mal");
    close();
    router.refresh();
  }

  async function doDelete(userId: string) {
    setBusy(true);
    setError(null);
    const res = await adminDeleteUser(userId);
    setBusy(false);
    if (!res.ok) return setError(res.error || "Algo salió mal");
    close();
    router.refresh();
  }

  return (
    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
      {users.map((u) => {
        const c = avatarColor(u.id);
        return (
        <Row key={u.id}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 38, height: 38, borderRadius: "50%", flex: "none", background: c.bg, color: c.fg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13 }}>
              {initialsOf(u.name)}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 16 }}>{u.name}</span>
                {u.id === meId && <span className="tag tag-muted">vos</span>}
                {u.is_admin && <span className="tag tag-solid">admin</span>}
              </div>
              {u.alias && <div style={{ fontSize: "12.5px", color: "var(--color-neutral-700)" }}>{u.alias}</div>}
            </div>
          </div>

          {openFor === u.id ? (
            mode === "pin" ? (
              <div style={{ background: "var(--color-neutral-100)", borderRadius: "var(--radius-md)", padding: "13px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="field-label">Nuevo PIN para {u.name}</div>
                <input
                  className="input"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  placeholder="4 a 6 números"
                  style={{ fontSize: 18, letterSpacing: ".3em" }}
                />
                {error && <div style={{ fontSize: "12.5px", color: "var(--color-accent-700)" }}>{error}</div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button type="button" className="btn btn-outline" onClick={close}>
                    Cancelar
                  </button>
                  <button type="button" className="btn btn-primary" disabled={busy} onClick={() => doResetPin(u.id)}>
                    Guardar PIN
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ background: "var(--color-accent-100)", borderRadius: "var(--radius-md)", padding: "13px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: "12.5px", color: "var(--color-accent-800)" }}>
                  Se borra la cuenta de {u.name}, sus eventos y todos los cumpleaños/aniversarios que haya cargado para otras personas. No se puede deshacer.
                </div>
                {error && <div style={{ fontSize: "12.5px", color: "var(--color-accent-700)" }}>{error}</div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button type="button" className="btn btn-outline" onClick={close}>
                    Cancelar
                  </button>
                  <button type="button" className="btn" style={{ background: "var(--color-accent-600)", color: "#fff" }} disabled={busy} onClick={() => doDelete(u.id)}>
                    Sí, eliminar
                  </button>
                </div>
              </div>
            )
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: u.id === meId ? "1fr" : "1fr 1fr", gap: 8 }}>
              <button type="button" className="btn btn-outline" onClick={() => openTool(u.id, "pin")}>
                Resetear PIN
              </button>
              {u.id !== meId && (
                <button type="button" className="btn btn-outline-accent" onClick={() => openTool(u.id, "delete")}>
                  Eliminar usuario
                </button>
              )}
            </div>
          )}
        </Row>
        );
      })}
    </div>
  );
}

/* ————— Fechas ————— */

function FechasTab({ people, users }: { people: PersonRow[]; users: UserRow[] }) {
  const [modal, setModal] = useState<PersonModalInitial | null>(null);

  function openEdit(p: PersonRow) {
    setModal({ id: p.id, name: p.name, kind: p.kind, day: String(p.day), month: String(p.month), year: String(p.year), isPrivate: p.is_private, remind: p.remind });
  }

  const sorted = [...people].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
      {sorted.length === 0 && <div style={{ padding: "24px 2px", fontSize: 13, color: "var(--color-neutral-700)" }}>No hay fechas cargadas.</div>}
      {sorted.map((p) => (
        <Row key={p.id}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 16 }}>{p.name}</span>
                <span className="tag tag-muted">{p.kind === "aniversario" ? "aniversario" : "cumple"}</span>
                {p.is_private && <span className="tag tag-solid">privado</span>}
              </div>
              <div style={{ fontSize: "12.5px", color: "var(--color-neutral-700)" }}>
                {dateLabel(p.day, p.month, p.year)} · agregado por {userName(users, p.added_by_id)}
                {p.user_id && ` · vinculado a ${userName(users, p.user_id)}`}
              </div>
            </div>
            <button type="button" className="btn btn-outline" style={{ padding: "9px 12px", fontSize: 12.5 }} onClick={() => openEdit(p)}>
              Editar
            </button>
          </div>
        </Row>
      ))}

      {modal && <PersonModal initial={modal} onClose={() => setModal(null)} asAdmin />}
    </div>
  );
}

/* ————— Eventos ————— */

function EventosTab({ events, users }: { events: EventRow[]; users: UserRow[] }) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusyKey(key);
    setError(null);
    const res = await fn();
    setBusyKey(null);
    if (!res.ok) return setError(res.error || "Algo salió mal");
    setConfirmDelete(null);
    router.refresh();
  }

  const sorted = [...events].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return (
    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
      {error && (
        <div className="status-error" style={{ margin: "0 0 4px" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 13, color: "var(--color-accent-700)" }}>{error}</div>
        </div>
      )}
      {sorted.length === 0 && <div style={{ padding: "24px 2px", fontSize: 13, color: "var(--color-neutral-700)" }}>No hay eventos.</div>}
      {sorted.map((e) => {
        const pending = settleFor(e, users);
        const total = e.expenses.reduce((s, x) => s + x.amount, 0);
        return (
          <Row key={e.id}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 16 }}>{e.name}</span>
                <span className={`tag ${e.closed ? "tag-muted" : "tag-solid"}`}>{e.closed ? "cerrado" : "abierto"}</span>
              </div>
              <div style={{ fontSize: "12.5px", color: "var(--color-neutral-700)" }}>
                creado por {userName(users, e.created_by)} · {e.participants.length} participantes · {money(total)} en gastos
                {pending.length > 0 && ` · ${pending.length} deuda${pending.length > 1 ? "s" : ""} sin saldar`}
              </div>
            </div>

            {e.expenses.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "8px 10px", background: "var(--color-neutral-100)", borderRadius: "var(--radius-sm)" }}>
                {e.expenses.map((x) => (
                  <div key={x.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "12.5px" }}>
                    <span style={{ flex: 1, color: "var(--color-neutral-700)" }}>
                      {x.description} · {userName(users, x.payer_id)}
                    </span>
                    <strong>{money(x.amount)}</strong>
                    <button
                      type="button"
                      className="btn btn-outline-accent"
                      style={{ padding: "5px 9px", fontSize: 11 }}
                      disabled={busyKey === `exp_${x.id}`}
                      onClick={() => run(`exp_${x.id}`, () => adminDeleteExpense(x.id))}
                    >
                      Borrar
                    </button>
                  </div>
                ))}
              </div>
            )}

            {confirmDelete === e.id ? (
              <div style={{ background: "var(--color-accent-100)", borderRadius: "var(--radius-md)", padding: "13px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: "12.5px", color: "var(--color-accent-800)" }}>Se borra el evento entero con todos sus gastos y pagos. No se puede deshacer.</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button type="button" className="btn btn-outline" onClick={() => setConfirmDelete(null)}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{ background: "var(--color-accent-600)", color: "#fff" }}
                    disabled={busyKey === `del_${e.id}`}
                    onClick={() => run(`del_${e.id}`, () => adminDeleteEvent(e.id))}
                  >
                    Sí, eliminar evento
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={busyKey === `close_${e.id}`}
                  onClick={() => run(`close_${e.id}`, () => (e.closed ? adminReopenEvent(e.id) : adminCloseEvent(e.id)))}
                >
                  {e.closed ? "Reabrir" : "Cerrar"}
                </button>
                <button type="button" className="btn btn-outline-accent" onClick={() => setConfirmDelete(e.id)}>
                  Eliminar evento
                </button>
              </div>
            )}
          </Row>
        );
      })}
    </div>
  );
}

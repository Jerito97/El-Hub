"use client";

// Create/edit sheet for an event: name, real participants with their
// cuotas, and temporary guests. The creator is always a locked-in
// participant and can't be untoggled (see `lockedId`).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { Stepper } from "@/components/ui/Stepper";
import { editEvent, saveEvent, type GuestInput } from "@/lib/actions/events";

export interface EventModalInitial {
  id: string;
  name: string;
  participantIds: string[];
  participantShares: Record<string, number>;
  creatorId: string;
}

interface PendingGuest {
  key: string;
  name: string;
  shares: number;
}

export function EventModal({
  meId,
  users,
  initial,
  onClose,
}: {
  meId: string;
  users: { id: string; name: string }[];
  initial?: EventModalInitial;
  onClose: () => void;
}) {
  const router = useRouter();
  const isEditing = !!initial;
  const lockedId = initial?.creatorId ?? meId;
  const [name, setName] = useState(initial?.name ?? "");
  const [participants, setParticipants] = useState<string[]>(initial?.participantIds.filter((id) => id !== lockedId) ?? []);
  const [shares, setShares] = useState<Record<string, number>>(initial?.participantShares ?? {});
  const [search, setSearch] = useState("");
  const [guests, setGuests] = useState<PendingGuest[]>([]);
  const [addingGuest, setAddingGuest] = useState(false);
  const [newGuestName, setNewGuestName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggle(id: string) {
    if (id === lockedId) return;
    setParticipants((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.concat(id)));
  }

  function setShareFor(id: string, v: number) {
    setShares((s) => ({ ...s, [id]: v }));
  }

  function addGuest() {
    const trimmed = newGuestName.trim();
    if (!trimmed) return;
    setGuests((g) => g.concat({ key: `g${Date.now()}${g.length}`, name: trimmed, shares: 1 }));
    setNewGuestName("");
    setAddingGuest(false);
  }

  function updateGuestLocal(key: string, patch: Partial<PendingGuest>) {
    setGuests((g) => g.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  }

  function removeGuestLocal(key: string) {
    setGuests((g) => g.filter((x) => x.key !== key));
  }

  async function submit() {
    setBusy(true);
    setError(null);
    const selectedIds = [lockedId, ...participants];
    const participantsPayload = selectedIds.map((id) => ({ id, shares: shares[id] ?? 1 }));
    const guestsPayload: GuestInput[] = guests.map((g) => ({ name: g.name, shares: g.shares }));

    if (isEditing) {
      const res = await editEvent(initial.id, name, participantsPayload, guestsPayload);
      setBusy(false);
      if (!res.ok) return setError(res.error || "Algo salió mal");
      router.refresh();
      onClose();
      return;
    }
    const res = await saveEvent(name, participantsPayload, guestsPayload);
    setBusy(false);
    if (!res.ok) return setError(res.error || "Algo salió mal");
    onClose();
    router.push(`/gastos/${res.eventId}`);
    router.refresh();
  }

  const filteredUsers = search.trim() ? users.filter((u) => u.name.toLowerCase().includes(search.trim().toLowerCase())) : users;
  const selectedUsers = users.filter((u) => u.id === lockedId || participants.includes(u.id));

  return (
    <Sheet title={isEditing ? "Editar evento" : "Nuevo evento"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="field">
          <label className="field-label">Nombre del evento</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Finde en Córdoba" />
        </div>
        <div>
          <div className="field-label">Participantes</div>
          <input
            className="input"
            style={{ marginTop: 8 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre"
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 9 }}>
            {filteredUsers.map((u) => {
              const on = u.id === lockedId || participants.includes(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggle(u.id)}
                  style={{ display: "flex", alignItems: "center", gap: 8, background: on ? "var(--color-text)" : "var(--color-surface)", color: on ? "var(--color-bg)" : "var(--color-text)", border: 0, borderRadius: "var(--radius-pill)", boxShadow: on ? "none" : "var(--shadow-card)", padding: "9px 14px 9px 10px", cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13 }}
                >
                  <span style={{ width: 18, height: 18, borderRadius: "50%", flex: "none", background: on ? "var(--color-accent)" : "var(--color-neutral-300)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {on && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
                    )}
                  </span>
                  {u.id === meId ? `${u.name} (vos)` : u.name}
                </button>
              );
            })}
            {filteredUsers.length === 0 && <div style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>Nadie con ese nombre.</div>}
          </div>
        </div>

        {selectedUsers.length > 0 && (
          <div>
            <div className="field-label">Cuotas por persona</div>
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column" }}>
              {selectedUsers.map((u) => (
                <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--color-neutral-300)" }}>
                  <span style={{ fontSize: "13.5px" }}>{u.id === meId ? `${u.name} (vos)` : u.name}</span>
                  <Stepper value={shares[u.id] ?? 1} onChange={(v) => setShareFor(u.id, v)} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="field-label">Invitados temporales</div>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
            {guests.map((g) => (
              <div key={g.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--color-neutral-300)" }}>
                <span style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 7, fontSize: "13.5px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {g.name}
                  <span className="tag tag-muted">Invitado</span>
                </span>
                <Stepper value={g.shares} onChange={(v) => updateGuestLocal(g.key, { shares: v })} />
                <button type="button" onClick={() => removeGuestLocal(g.key)} style={{ flex: "none", background: "transparent", border: 0, cursor: "pointer", fontSize: 15, color: "var(--color-neutral-700)" }}>
                  ✕
                </button>
              </div>
            ))}

            {addingGuest ? (
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="input"
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  placeholder="Nombre del invitado"
                  autoFocus
                />
                <button type="button" className="btn btn-primary" style={{ flex: "none", padding: "0 14px" }} onClick={addGuest}>
                  Agregar
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn-outline" onClick={() => setAddingGuest(true)}>
                + Invitado temporal
              </button>
            )}
          </div>
        </div>

        {error && <div style={{ fontSize: "12.5px", color: "var(--color-accent-700)" }}>{error}</div>}
        <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={submit}>
          {isEditing ? "Guardar cambios" : "Crear evento"}
        </button>
      </div>
    </Sheet>
  );
}

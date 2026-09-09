"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { editEvent, saveEvent } from "@/lib/actions/events";

export interface EventModalInitial {
  id: string;
  name: string;
  participantIds: string[];
  creatorId: string;
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
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggle(id: string) {
    if (id === lockedId) return;
    setParticipants((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.concat(id)));
  }

  async function submit() {
    setBusy(true);
    setError(null);
    if (isEditing) {
      const res = await editEvent(initial.id, name, participants);
      setBusy(false);
      if (!res.ok) return setError(res.error || "Algo salió mal");
      router.refresh();
      onClose();
      return;
    }
    const res = await saveEvent(name, participants);
    setBusy(false);
    if (!res.ok) return setError(res.error || "Algo salió mal");
    onClose();
    router.push(`/gastos/${res.eventId}`);
    router.refresh();
  }

  const filteredUsers = search.trim() ? users.filter((u) => u.name.toLowerCase().includes(search.trim().toLowerCase())) : users;

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
                  style={{ display: "flex", alignItems: "center", gap: 8, background: on ? "var(--color-text)" : "transparent", color: on ? "var(--color-bg)" : "var(--color-text)", border: "2px solid var(--color-text)", padding: "9px 12px", cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 13 }}
                >
                  <span style={{ width: 10, height: 10, background: on ? "var(--color-accent)" : "var(--color-neutral-400)" }} />
                  {u.id === meId ? `${u.name} (vos)` : u.name}
                </button>
              );
            })}
            {filteredUsers.length === 0 && <div style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>Nadie con ese nombre.</div>}
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

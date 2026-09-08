"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { saveEvent } from "@/lib/actions/events";

export function EventModal({ meId, users, onClose }: { meId: string; users: { id: string; name: string }[]; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggle(id: string) {
    if (id === meId) return;
    setParticipants((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.concat(id)));
  }

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await saveEvent(name, participants);
    setBusy(false);
    if (!res.ok) return setError(res.error || "Algo salió mal");
    onClose();
    router.push(`/gastos/${res.eventId}`);
    router.refresh();
  }

  return (
    <Sheet title="Nuevo evento" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="field">
          <label className="field-label">Nombre del evento</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Finde en Córdoba" />
        </div>
        <div>
          <div className="field-label">Participantes</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 9 }}>
            {users.map((u) => {
              const on = u.id === meId || participants.includes(u.id);
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
          </div>
        </div>
        {error && <div style={{ fontSize: "12.5px", color: "var(--color-accent-700)" }}>{error}</div>}
        <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={submit}>
          Crear evento
        </button>
      </div>
    </Sheet>
  );
}

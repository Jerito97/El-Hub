"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { DateSelect } from "@/components/ui/DateSelect";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { Switch } from "@/components/ui/Switch";
import { deletePerson, savePerson, savePersonEdit, type PersonInput } from "@/lib/actions/people";
import { adminDeletePerson, adminSavePersonEdit } from "@/lib/actions/admin";
import type { PersonKind } from "@/lib/types";

export interface PersonModalInitial {
  id?: string;
  name: string;
  kind: PersonKind;
  day: string;
  month: string;
  year: string;
  isPrivate: boolean;
  remind: boolean;
}

/** asAdmin=true edits/deletes regardless of who added the entry (see lib/actions/admin.ts). */
export function PersonModal({ initial, onClose, asAdmin = false }: { initial: PersonModalInitial; onClose: () => void; asAdmin?: boolean }) {
  const router = useRouter();
  const isEditing = !!initial.id;
  const [name, setName] = useState(initial.name);
  const [kind, setKind] = useState<PersonKind>(initial.kind);
  const [day, setDay] = useState(initial.day);
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);
  const [isPrivate, setIsPrivate] = useState(initial.isPrivate);
  const [remind, setRemind] = useState(initial.remind);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setError(null);
    const input: PersonInput = { name, kind, day: +day, month: +month, year: +year, isPrivate, remind };
    const res = isEditing ? await (asAdmin ? adminSavePersonEdit : savePersonEdit)(initial.id!, input) : await savePerson(input);
    setBusy(false);
    if (!res.ok) return setError(res.error || "Algo salió mal");
    router.refresh();
    onClose();
  }

  async function remove() {
    setBusy(true);
    const res = await (asAdmin ? adminDeletePerson : deletePerson)(initial.id!);
    setBusy(false);
    if (!res.ok) return setError(res.error || "No se pudo borrar.");
    router.refresh();
    onClose();
  }

  return (
    <Sheet title={isEditing ? "Editar fecha" : "Agregar fecha"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div className="field-label">Tipo de fecha</div>
          <div className="seg2" style={{ marginTop: 8 }}>
            {(["cumple", "aniversario"] as PersonKind[]).map((k) => (
              <button
                key={k}
                type="button"
                className="seg-btn"
                style={{ background: kind === k ? (k === "aniversario" ? "var(--color-text)" : "var(--color-accent-600)") : "transparent", color: kind === k ? "#fff" : "var(--color-neutral-700)" }}
                onClick={() => setKind(k)}
              >
                {k === "aniversario" ? "Aniversario" : "Cumpleaños"}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="field-label">Nombre</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Juli" />
        </div>

        <div className="field">
          <label className="field-label">{kind === "aniversario" ? "Fecha del aniversario" : "Fecha de cumpleaños"}</label>
          <DateSelect day={day} month={month} year={year} onDay={setDay} onMonth={setMonth} onYear={setYear} />
        </div>

        <div>
          <div className="field-label">Visibilidad</div>
          <div style={{ marginTop: 8 }}>
            <SegmentedToggle
              options={[{ value: "publico", label: "Público" }, { value: "privado", label: "Privado" }]}
              value={isPrivate ? "privado" : "publico"}
              onChange={(v) => setIsPrivate(v === "privado")}
            />
          </div>
          <div style={{ marginTop: 7, fontSize: 12, color: "var(--color-neutral-700)" }}>{isPrivate ? "Solo vos vas a ver esta fecha." : "Todo el grupo la va a ver."}</div>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div className="field-label">Recordatorio</div>
            <Switch on={remind} onToggle={() => setRemind((r) => !r)} variant="outline" />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-neutral-700)" }}>{remind ? "Te avisamos el mismo día a las 9:00." : "Sin recordatorio para esta fecha."}</div>
        </div>

        {error && <div style={{ fontSize: "12.5px", color: "var(--color-accent-700)" }}>{error}</div>}

        {isEditing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={save}>
              Guardar cambios
            </button>
            {!confirmDelete ? (
              <button type="button" className="btn btn-outline-accent btn-block" onClick={() => setConfirmDelete(true)}>
                {kind === "aniversario" ? "Borrar aniversario" : "Borrar cumpleaños"}
              </button>
            ) : (
              <div style={{ border: "2px solid var(--color-accent-600)", padding: "13px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: "12.5px", color: "var(--color-accent-800)" }}>¿Seguro que lo borrás? No se puede recuperar.</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button type="button" className="btn btn-outline" onClick={() => setConfirmDelete(false)}>
                    No
                  </button>
                  <button type="button" className="btn" style={{ background: "var(--color-accent-600)", color: "#fff" }} disabled={busy} onClick={remove}>
                    Sí, borrar
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={save}>
            Guardar persona
          </button>
        )}
      </div>
    </Sheet>
  );
}

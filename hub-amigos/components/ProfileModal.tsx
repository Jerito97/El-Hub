"use client";

// "Mi perfil" sheet (opened from Config): edit your own name/birthday/alias
// in place, plus logout. Each field has its own inline edit/save state
// rather than one shared form, since they save independently.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { DateSelect } from "@/components/ui/DateSelect";
import { logoutAction } from "@/lib/actions/auth";
import { saveAlias, saveBirthday, saveName } from "@/lib/actions/profile";
import { dateLabel, initialsOf, avatarColor } from "@/lib/format";

export interface ProfileInitial {
  id: string;
  name: string;
  alias: string;
  day: string;
  month: string;
  year: string;
}

export function ProfileModal({ initial, onClose }: { initial: ProfileInitial; onClose: () => void }) {
  const router = useRouter();
  const c = avatarColor(initial.id);

  const [name, setName] = useState(initial.name);
  const [nameEditing, setNameEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(initial.name);
  const [nameError, setNameError] = useState<string | null>(null);

  const [day, setDay] = useState(initial.day);
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);
  const [bdEditing, setBdEditing] = useState(false);
  const [bdDay, setBdDay] = useState(initial.day);
  const [bdMonth, setBdMonth] = useState(initial.month);
  const [bdYear, setBdYear] = useState(initial.year);
  const [bdError, setBdError] = useState<string | null>(null);

  const [alias, setAlias] = useState(initial.alias);
  const [aliasEditing, setAliasEditing] = useState(!initial.alias);
  const [aliasDraft, setAliasDraft] = useState(initial.alias);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const birthdayLabel = day && month && year ? dateLabel(+day, +month, +year) : "sin cargar";

  async function onSaveName() {
    setBusy(true);
    setNameError(null);
    const res = await saveName(nameDraft);
    setBusy(false);
    if (!res.ok) return setNameError(res.error || "Algo salió mal");
    setName(nameDraft.trim());
    setNameEditing(false);
    router.refresh();
  }

  async function onSaveBirthday() {
    setBusy(true);
    setBdError(null);
    const res = await saveBirthday(+bdDay, +bdMonth, +bdYear);
    setBusy(false);
    if (!res.ok) return setBdError(res.error || "Algo salió mal");
    setDay(bdDay);
    setMonth(bdMonth);
    setYear(bdYear);
    setBdEditing(false);
    router.refresh();
  }

  async function onSaveAlias() {
    setBusy(true);
    await saveAlias(aliasDraft);
    setBusy(false);
    setAlias(aliasDraft.trim());
    setAliasEditing(false);
    router.refresh();
  }

  async function copyAlias() {
    try {
      await navigator.clipboard.writeText(alias);
    } catch {
      // ignore
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Sheet title="Tu perfil" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: c.bg, color: c.fg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22 }}>{initialsOf(name)}</div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 22 }}>{name}</span>
              {!nameEditing && (
                <button type="button" title="Editar nombre" className="tap-icon" style={{ width: 36, height: 36 }} onClick={() => { setNameDraft(name); setNameEditing(true); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                  </svg>
                </button>
              )}
            </div>
            {!bdEditing && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "12.5px", color: "var(--color-neutral-700)" }}>Cumpleaños: {birthdayLabel}</span>
                <button
                  type="button"
                  title="Editar cumpleaños"
                  className="tap-icon"
                  style={{ width: 36, height: 36 }}
                  onClick={() => {
                    setBdDay(day);
                    setBdMonth(month);
                    setBdYear(year);
                    setBdEditing(true);
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {nameEditing && (
          <div style={{ paddingTop: 4 }}>
            <div className="field-label">Cambiar tu nombre</div>
            <div style={{ marginTop: 9, display: "flex", gap: 8, alignItems: "stretch" }}>
              <input className="input" style={{ flex: 1, minWidth: 0 }} value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder="Tu nombre" />
              <button type="button" className="btn btn-primary" style={{ flex: "none", padding: "12px 15px", fontSize: 13 }} disabled={busy} onClick={onSaveName}>
                Guardar
              </button>
            </div>
            {nameError && <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-accent-700)" }}>{nameError}</div>}
          </div>
        )}

        {bdEditing && (
          <div style={{ paddingTop: 4 }}>
            <div className="field-label">Corregir tu cumpleaños</div>
            <div style={{ marginTop: 8 }}>
              <DateSelect day={bdDay} month={bdMonth} year={bdYear} onDay={setBdDay} onMonth={setBdMonth} onYear={setBdYear} />
            </div>
            {bdError && <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-accent-700)" }}>{bdError}</div>}
            <button type="button" className="btn btn-primary btn-block" style={{ marginTop: 10 }} disabled={busy} onClick={onSaveBirthday}>
              Guardar cumpleaños
            </button>
          </div>
        )}

        <div style={{ paddingTop: 4 }}>
          <div className="field-label">Alias para que te transfieran</div>
          {!aliasEditing ? (
            <>
              <div style={{ marginTop: 10, display: "flex", alignItems: "stretch", background: "var(--color-neutral-100)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                <div style={{ flex: 1, minWidth: 0, padding: "12px 13px", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{alias}</div>
                <button type="button" onClick={copyAlias} style={{ flex: "none", background: "var(--color-accent)", color: "#fff", border: 0, padding: "0 15px", cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "12.5px" }}>
                  {copied ? "¡Copiado!" : "Copiar"}
                </button>
              </div>
              <button type="button" className="btn-ghost" style={{ marginTop: 8, display: "block" }} onClick={() => { setAliasDraft(alias); setAliasEditing(true); }}>
                Editar alias
              </button>
            </>
          ) : (
            <div style={{ marginTop: 10, display: "flex", alignItems: "stretch", gap: 8 }}>
              <input className="input" style={{ flex: 1, minWidth: 0 }} value={aliasDraft} onChange={(e) => setAliasDraft(e.target.value)} placeholder="tu.alias.banco" />
              <button type="button" className="btn btn-primary" style={{ flex: "none", padding: "12px 15px", fontSize: 13 }} disabled={busy} onClick={onSaveAlias}>
                Guardar
              </button>
            </div>
          )}
        </div>

        <form action={logoutAction}>
          <button type="submit" className="btn btn-secondary btn-block" style={{ justifyContent: "flex-start" }}>
            Salir de la sesión
          </button>
        </form>
      </div>
    </Sheet>
  );
}

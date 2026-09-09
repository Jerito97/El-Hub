"use client";

import { useState } from "react";
import { confirmLink, finishSetup, submitLogin } from "@/lib/actions/auth";
import { DateSelect } from "@/components/ui/DateSelect";
import { initialsOf } from "@/lib/format";

type Step = "login" | "link" | "setup";

export function LoginClient() {
  const [step, setStep] = useState<Step>("login");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [linkCandidate, setLinkCandidate] = useState<{ id: string; name: string; dateLabel: string } | null>(null);

  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [alias, setAlias] = useState("");
  const [setupError, setSetupError] = useState<string | null>(null);

  async function onSubmitLogin() {
    setBusy(true);
    setError(null);
    setHint(null);
    const res = await submitLogin(name, pin);
    setBusy(false);
    if (!res.ok) {
      setError(res.error || "Algo salió mal");
      setHint(res.hint || null);
      return;
    }
    if (res.linkCandidate) {
      setLinkCandidate(res.linkCandidate);
      setStep("link");
      return;
    }
    if (res.needsSetup) {
      setStep("setup");
    }
  }

  async function onConfirmLink() {
    if (!linkCandidate) return;
    setBusy(true);
    const res = await confirmLink(linkCandidate.id, pin);
    setBusy(false);
    if (!res.ok) setError([res.error, res.hint].filter(Boolean).join(": ") || "Algo salió mal");
  }

  function onRejectLink() {
    setLinkCandidate(null);
    setStep("setup");
  }

  async function onFinishSetup() {
    setSetupError(null);
    setBusy(true);
    const res = await finishSetup({ name, pin, day: +day, month: +month, year: +year, alias });
    setBusy(false);
    if (!res.ok) setSetupError([res.error, res.hint].filter(Boolean).join(": ") || "Algo salió mal");
  }

  if (step === "link" && linkCandidate) {
    return (
      <div className="hub-auth" style={{ padding: "36px 24px 28px" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-accent)" }}>
          Encontramos tu nombre
        </div>
        <h1 style={{ fontSize: 40, lineHeight: 1, margin: "16px 0 0" }}>
          ¿Sos vos,
          <br />
          {linkCandidate.name}?
        </h1>
        <p style={{ margin: "14px 0 0", fontSize: "14.5px", color: "var(--color-neutral-700)" }}>
          Alguien ya te cargó como cumpleaños en el grupo. Enganchate a ese registro así no quedan dos {linkCandidate.name} dando vueltas.
        </p>

        <div style={{ marginTop: 26, border: "2px solid var(--color-text)", background: "var(--color-neutral-100)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 18 }}>
            <div style={{ width: 52, height: 52, background: "var(--color-text)", color: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 19 }}>
              {initialsOf(linkCandidate.name)}
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 20 }}>{linkCandidate.name}</div>
              <div style={{ fontSize: 13, color: "var(--color-neutral-700)" }}>{linkCandidate.dateLabel}</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="status-error" style={{ marginTop: 18 }}>
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 14, color: "var(--color-accent-700)" }}>{error}</div>
          </div>
        )}

        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
          <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={onConfirmLink}>
            Sí, soy yo — vincular mi usuario
          </button>
          <button type="button" className="btn btn-secondary btn-block" onClick={onRejectLink}>
            No, crear un usuario nuevo
          </button>
        </div>
        <div style={{ marginTop: "auto", paddingTop: 24, fontSize: 12, color: "var(--color-neutral-600)" }}>
          Si te vinculás, tu cumpleaños pasa a estar &ldquo;en la app&rdquo; y podés participar de gastos.
        </div>
      </div>
    );
  }

  if (step === "setup") {
    return (
      <div className="hub-auth" style={{ padding: "36px 24px 28px" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-accent)" }}>
          Usuario nuevo
        </div>
        <h1 style={{ fontSize: 40, lineHeight: 1, margin: "16px 0 0" }}>
          Bienvenido,
          <br />
          {name.trim()}.
        </h1>

        <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="field">
            <label className="field-label">Tu cumpleaños</label>
            <DateSelect day={day} month={month} year={year} onDay={setDay} onMonth={setMonth} onYear={setYear} />
          </div>
          <div className="field">
            <label className="field-label">Tu alias (opcional)</label>
            <input className="input" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="tu.alias.banco" />
          </div>

          {setupError && (
            <div className="status-error" style={{ padding: "13px 15px" }}>
              <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "13.5px", color: "var(--color-accent-700)" }}>{setupError}</div>
            </div>
          )}

          <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={onFinishSetup}>
            Entrar al hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="hub-auth" style={{ padding: "36px 24px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img src="/icon-192.png" alt="" width={30} height={30} style={{ borderRadius: 7 }} />
        <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase" }}>LinkUp</span>
      </div>
      <h1 style={{ fontSize: 52, lineHeight: 0.95, margin: "28px 0 0" }}>
        Entrá
        <br />
        al grupo.
      </h1>

      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="field">
          <label className="field-label">Tu nombre</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Nacho" />
        </div>
        <div className="field">
          <label className="field-label">PIN (4 a 6 dígitos)</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              className="input"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="••••"
              style={{ flex: 1, fontSize: 22, letterSpacing: ".5em", borderColor: error ? "var(--color-accent)" : "var(--color-text)" }}
            />
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 13, color: "var(--color-neutral-600)", minWidth: 34 }}>{pin.length}/6</div>
          </div>
        </div>

        {error && (
          <div className="status-error">
            <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 14, color: "var(--color-accent-700)" }}>{error}</div>
            {hint && <div style={{ fontSize: "12.5px", color: "var(--color-accent-800)" }}>{hint}</div>}
          </div>
        )}

        <button type="button" className="btn btn-primary" style={{ justifyContent: "flex-start", width: "100%", fontSize: 16 }} disabled={busy} onClick={onSubmitLogin}>
          Entrar →
        </button>
      </div>
    </div>
  );
}

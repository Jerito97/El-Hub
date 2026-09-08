"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/Switch";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { ProfileModal, type ProfileInitial } from "@/components/ProfileModal";
import { updatePrefs } from "@/lib/actions/prefs";
import { applyThemeOptimistically } from "@/lib/client/ThemeSync";
import type { PrefsRow } from "@/lib/types";

const NOTIF_ROWS: Array<{ key: keyof Pick<PrefsRow, "notif_cumple" | "notif_gasto" | "notif_resumen">; label: string }> = [
  { key: "notif_cumple", label: "Avisos de cumpleaños y aniversarios" },
  { key: "notif_gasto", label: "Nuevos gastos en mis eventos" },
  { key: "notif_resumen", label: "Resumen semanal de deudas" },
];

export function ConfigClient({ prefs, profileInitial }: { prefs: PrefsRow; profileInitial: ProfileInitial }) {
  const router = useRouter();
  const [local, setLocal] = useState(prefs);
  const [profileOpen, setProfileOpen] = useState(false);

  async function toggleNotif(key: (typeof NOTIF_ROWS)[number]["key"]) {
    const next = { ...local, [key]: !local[key] };
    setLocal(next);
    await updatePrefs({ [key]: next[key] });
    router.refresh();
  }

  async function pickTheme(theme: "claro" | "oscuro") {
    setLocal((l) => ({ ...l, theme }));
    applyThemeOptimistically(theme);
    await updatePrefs({ theme });
    router.refresh();
  }

  return (
    <div style={{ padding: "22px 18px 30px" }}>
      <h1 style={{ fontSize: 32 }}>Configuración</h1>

      <div style={{ marginTop: 22, borderTop: "2px solid var(--color-divider)", paddingTop: 14 }}>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>Notificaciones</div>
        {NOTIF_ROWS.map((row) => (
          <button
            key={row.key}
            type="button"
            onClick={() => toggleNotif(row.key)}
            style={{ width: "100%", background: "transparent", border: 0, borderBottom: "1px solid var(--color-neutral-300)", padding: "14px 2px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}
          >
            <span style={{ flex: 1, fontSize: 14 }}>{row.label}</span>
            <Switch on={!!local[row.key]} onToggle={() => toggleNotif(row.key)} />
          </button>
        ))}
      </div>

      <div style={{ marginTop: 22, borderTop: "2px solid var(--color-divider)", paddingTop: 14 }}>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>Tema</div>
        <div style={{ marginTop: 9 }}>
          <SegmentedToggle options={[{ value: "claro", label: "Claro" }, { value: "oscuro", label: "Oscuro" }]} value={local.theme} onChange={(v) => pickTheme(v as "claro" | "oscuro")} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setProfileOpen(true)}
        style={{ marginTop: 24, width: "100%", background: "var(--color-text)", color: "var(--color-bg)", border: 0, padding: "15px 16px", cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: "13.5px", textAlign: "center", textTransform: "uppercase", letterSpacing: ".06em" }}
      >
        Mi perfil
      </button>

      {profileOpen && <ProfileModal initial={profileInitial} onClose={() => setProfileOpen(false)} />}
    </div>
  );
}

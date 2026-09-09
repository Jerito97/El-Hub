"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/Switch";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { ProfileModal, type ProfileInitial } from "@/components/ProfileModal";
import { PushToggle } from "@/components/PushToggle";
import { updatePrefs } from "@/lib/actions/prefs";
import { applyThemeOptimistically } from "@/lib/client/ThemeSync";
import type { PrefsRow } from "@/lib/types";

const NOTIF_ROWS: Array<{ key: keyof Pick<PrefsRow, "notif_cumple" | "notif_gasto" | "notif_resumen">; label: string }> = [
  { key: "notif_cumple", label: "Avisos de cumpleaños y aniversarios" },
  { key: "notif_gasto", label: "Nuevos gastos en mis eventos" },
  { key: "notif_resumen", label: "Resumen semanal de deudas" },
];

export function ConfigClient({ prefs, profileInitial, vapidPublicKey }: { prefs: PrefsRow; profileInitial: ProfileInitial; vapidPublicKey: string | null }) {
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

      <div style={{ marginTop: 22 }}>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-neutral-600)", marginBottom: 8 }}>Notificaciones</div>
        <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
          {NOTIF_ROWS.map((row, i) => (
            <button
              key={row.key}
              type="button"
              onClick={() => toggleNotif(row.key)}
              style={{ width: "100%", background: "transparent", border: 0, borderBottom: i < NOTIF_ROWS.length - 1 ? "1px solid var(--color-neutral-200)" : 0, padding: "15px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}
            >
              <span style={{ flex: 1, fontSize: 14 }}>{row.label}</span>
              <Switch on={!!local[row.key]} onToggle={() => toggleNotif(row.key)} />
            </button>
          ))}
        </div>
        {vapidPublicKey && <PushToggle vapidPublicKey={vapidPublicKey} />}
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>Tema</div>
        <div style={{ marginTop: 9 }}>
          <SegmentedToggle options={[{ value: "claro", label: "Claro" }, { value: "oscuro", label: "Oscuro" }]} value={local.theme} onChange={(v) => pickTheme(v as "claro" | "oscuro")} />
        </div>
      </div>

      <button type="button" className="btn btn-dark btn-block" style={{ marginTop: 24, padding: "15px 16px" }} onClick={() => setProfileOpen(true)}>
        Mi perfil
      </button>

      {profileOpen && <ProfileModal initial={profileInitial} onClose={() => setProfileOpen(false)} />}
    </div>
  );
}

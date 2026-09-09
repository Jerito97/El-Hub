"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/Switch";
import { subscribeToPush, unsubscribeFromPush } from "@/lib/actions/push";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/** Lets the user opt this device in/out of web push (birthday-today and new-expense alerts). */
export function PushToggle({ vapidPublicKey }: { vapidPublicKey: string }) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEnabled(!!sub))
      .catch(() => {});
  }, []);

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("No diste permiso para notificaciones.");
        setBusy(false);
        return;
      }
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource });
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error("subscription incompleta");
      const res = await subscribeToPush({ endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } });
      if (!res.ok) throw new Error("save failed");
      setEnabled(true);
    } catch {
      setError("No se pudo activar. Probá de nuevo.");
    }
    setBusy(false);
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await unsubscribeFromPush(sub.endpoint);
        await sub.unsubscribe();
      }
      setEnabled(false);
    } catch {
      setError("No se pudo desactivar.");
    }
    setBusy(false);
  }

  if (!supported) return null;

  return (
    <div style={{ marginTop: 10, padding: "14px", background: "#fff", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-card)", display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", fontSize: 14 }}>Notificaciones push en este dispositivo</span>
        <span style={{ display: "block", marginTop: 2, fontSize: "11.5px", color: "var(--color-neutral-600)" }}>
          {error || "Necesario además de los avisos de arriba para recibir alertas fuera de la app."}
        </span>
      </span>
      <Switch on={enabled} onToggle={() => (busy ? undefined : enabled ? disable() : enable())} />
    </div>
  );
}

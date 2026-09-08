"use client";

import { createContext, useContext, useState } from "react";

interface Ctx {
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
  notifsOpen: boolean;
  setNotifsOpen: (v: boolean) => void;
}

const AppShellCtx = createContext<Ctx | null>(null);

export function AppShellProvider({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  return <AppShellCtx.Provider value={{ drawerOpen, setDrawerOpen, notifsOpen, setNotifsOpen }}>{children}</AppShellCtx.Provider>;
}

export function useAppShell() {
  const ctx = useContext(AppShellCtx);
  if (!ctx) throw new Error("useAppShell must be used within <AppShellProvider>");
  return ctx;
}

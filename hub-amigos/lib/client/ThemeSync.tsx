"use client";

import { useEffect } from "react";

/** Keeps <html data-theme> and the FOUC-prevention localStorage flag in sync with the DB pref. */
export function ThemeSync({ theme }: { theme: "claro" | "oscuro" }) {
  useEffect(() => {
    if (theme === "oscuro") document.documentElement.setAttribute("data-theme", "oscuro");
    else document.documentElement.removeAttribute("data-theme");
    try {
      localStorage.setItem("hub-theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);
  return null;
}

export function applyThemeOptimistically(theme: "claro" | "oscuro") {
  if (theme === "oscuro") document.documentElement.setAttribute("data-theme", "oscuro");
  else document.documentElement.removeAttribute("data-theme");
  try {
    localStorage.setItem("hub-theme", theme);
  } catch {
    // ignore
  }
}

"use client";

import { useEffect, useRef } from "react";
import { useAppShell } from "@/lib/client/AppShellContext";

const EDGE_ZONE = 24; // px from the screen edge where a swipe can start
const THRESHOLD = 60; // px of horizontal movement needed to trigger

/** Swipe in from the left edge to open the menu, from the right edge to open notifications. */
export function EdgeSwipe() {
  const { drawerOpen, setDrawerOpen, notifsOpen, setNotifsOpen } = useAppShell();
  const start = useRef<{ x: number; y: number; edge: "left" | "right" } | null>(null);
  const stateRef = useRef({ drawerOpen, notifsOpen });
  stateRef.current = { drawerOpen, notifsOpen };

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (stateRef.current.drawerOpen || stateRef.current.notifsOpen || e.touches.length !== 1) {
        start.current = null;
        return;
      }
      const t = e.touches[0];
      const w = window.innerWidth;
      if (t.clientX <= EDGE_ZONE) start.current = { x: t.clientX, y: t.clientY, edge: "left" };
      else if (t.clientX >= w - EDGE_ZONE) start.current = { x: t.clientX, y: t.clientY, edge: "right" };
      else start.current = null;
    }

    function onTouchMove(e: TouchEvent) {
      if (!start.current) return;
      const t = e.touches[0];
      const dx = t.clientX - start.current.x;
      const dy = t.clientY - start.current.y;
      if (Math.abs(dy) > Math.abs(dx)) return; // vertical scroll, not our gesture

      if (start.current.edge === "left" && dx > THRESHOLD) {
        setDrawerOpen(true);
        start.current = null;
      } else if (start.current.edge === "right" && dx < -THRESHOLD) {
        setNotifsOpen(true);
        start.current = null;
      }
    }

    function onTouchEnd() {
      start.current = null;
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [setDrawerOpen, setNotifsOpen]);

  return null;
}

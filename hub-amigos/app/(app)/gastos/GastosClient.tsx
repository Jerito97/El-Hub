"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { EventModal } from "@/components/EventModal";
import { settleWith } from "@/lib/actions/events";
import { money } from "@/lib/format";
import type { ConsolidatedRow, EventListItem } from "@/lib/domain";

interface UserLite {
  id: string;
  name: string;
  alias: string;
}

export function GastosClient({
  meId,
  users,
  openEvents,
  closedEvents,
  consolidated,
  initialView,
}: {
  meId: string;
  users: UserLite[];
  openEvents: EventListItem[];
  closedEvents: EventListItem[];
  consolidated: ConsolidatedRow[];
  initialView: "eventos" | "balance";
}) {
  const router = useRouter();
  const [view, setView] = useState<"eventos" | "balance">(initialView);
  const [showHistory, setShowHistory] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const list = (showHistory ? closedEvents : openEvents).filter((e) => !search.trim() || e.name.toLowerCase().includes(search.trim().toLowerCase()));

  function userById(id: string) {
    return users.find((u) => u.id === id);
  }

  async function copyAlias(alias: string, key: string) {
    try {
      await navigator.clipboard.writeText(alias);
    } catch {
      // clipboard unavailable — ignore
    }
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1600);
  }

  async function settle(eventId: string, fromId: string, toId: string, amount: number, key: string) {
    setBusyKey(key);
    await settleWith(eventId, fromId, toId, amount);
    setBusyKey(null);
    router.refresh();
  }

  return (
    <div style={{ padding: "22px 18px 30px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontSize: 32 }}>Gastos</h1>
        <button type="button" className="btn btn-primary" style={{ padding: "10px 13px", fontSize: 13 }} onClick={() => setNewEventOpen(true)}>
          + Evento
        </button>
      </div>

      <div className="seg2" style={{ marginTop: 14 }}>
        <SegmentedToggle
          options={[{ value: "eventos", label: "Eventos" }, { value: "balance", label: "Balance" }]}
          value={view}
          onChange={(v) => {
            setView(v as "eventos" | "balance");
            setExpanded(null);
          }}
        />
      </div>

      {view === "balance" ? (
        <div style={{ marginTop: 18, borderTop: "2px solid var(--color-divider)" }}>
          {consolidated.length === 0 && <div style={{ padding: "24px 2px", fontSize: 13, color: "var(--color-neutral-700)" }}>No tenés cuentas pendientes con nadie.</div>}
          {consolidated.map((c) => (
            <div key={c.name} style={{ borderBottom: "1px solid var(--color-neutral-300)" }}>
              <button
                type="button"
                onClick={() => setExpanded(expanded === c.name ? null : c.name)}
                style={{ width: "100%", textAlign: "left", background: "transparent", border: 0, padding: "14px 2px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
              >
                <span style={{ width: 38, height: 38, flex: "none", background: "var(--color-accent-600)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 13 }}>{c.initials}</span>
                <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 17 }}>{c.name}</span>
                <span style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: "10.5px", letterSpacing: ".09em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>{c.stateLabel}</span>
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 17, color: c.amountColor }}>{c.amountLabel}</span>
                </span>
              </button>
              {expanded === c.name && (
                <div style={{ padding: "2px 2px 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {c.rows.map((r, i) => {
                    const other = userById(c.otherId);
                    const canCopy = r.dir === "debo" && other?.alias;
                    const ckey = `${c.name}_${r.eventId}_${i}`;
                    const settleKey = `settle_${ckey}`;
                    return (
                      <div key={ckey} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "12.5px" }}>
                        <span style={{ flex: 1, color: "var(--color-neutral-700)" }}>{r.event}</span>
                        <span style={{ color: "var(--color-neutral-600)" }}>{r.dir === "debe" ? "te debe" : "le debés"}</span>
                        <strong>{money(r.amount)}</strong>
                        {canCopy && (
                          <button type="button" title="Copiar alias" className="tap-icon" style={{ width: 44, minHeight: 44 }} onClick={() => copyAlias(other!.alias, ckey)}>
                            {copied === ckey ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6 9 17l-5-5"></path>
                              </svg>
                            ) : (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="11" height="11"></rect>
                                <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"></path>
                              </svg>
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busyKey === settleKey}
                          className="btn"
                          style={{ flex: "none", background: "var(--color-text)", color: "var(--color-bg)", minHeight: 44, padding: "0 12px", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: ".05em" }}
                          onClick={() => settle(r.eventId, r.dir === "debo" ? meId : c.otherId, r.dir === "debo" ? c.otherId : meId, r.amount, settleKey)}
                        >
                          Pagado
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div style={{ marginTop: 12, display: "flex", alignItems: "stretch", border: "2px solid var(--color-text)" }}>
            <input className="input" style={{ border: 0 }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar evento" />
            {search && (
              <button type="button" onClick={() => setSearch("")} style={{ flex: "none", background: "transparent", border: 0, borderLeft: "2px solid var(--color-text)", padding: "0 13px", cursor: "pointer", fontSize: 15, color: "var(--color-neutral-700)" }}>
                ✕
              </button>
            )}
          </div>

          {showHistory && (
            <div style={{ marginTop: 14, fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>Eventos cerrados</div>
          )}

          <div style={{ marginTop: 14, borderTop: "2px solid var(--color-divider)" }}>
            {list.map((e) => (
              <Link
                key={e.id}
                href={`/gastos/${e.id}`}
                style={{ display: "flex", gap: 12, alignItems: "flex-start", borderBottom: "1px solid var(--color-neutral-300)", padding: "16px 2px" }}
              >
                <span style={{ width: 4, alignSelf: "stretch", background: "var(--color-accent)", flex: "none" }} />
                <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 18, lineHeight: 1.15 }}>{e.name}</span>
                  <span style={{ fontSize: "12.5px", color: "var(--color-neutral-700)" }}>
                    {e.dateLabel} · {e.participantsLabel}
                  </span>
                  <span style={{ display: "flex", gap: 4 }}>
                    {e.avatarInitials.map((ini, i) => (
                      <span key={i} style={{ width: 24, height: 24, background: "var(--color-text)", color: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 10 }}>
                        {ini}
                      </span>
                    ))}
                  </span>
                </span>
                <span style={{ textAlign: "right", flex: "none", display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>{e.balanceKind}</span>
                  <span style={{ fontFamily: "var(--font-heading)", fontWeight: 900, fontSize: 17, color: e.balanceColor }}>{e.balanceAmountLabel}</span>
                  <span style={{ fontSize: 11, color: "var(--color-neutral-600)" }}>{e.totalLabel}</span>
                </span>
              </Link>
            ))}
            {list.length === 0 && (
              <div style={{ padding: "24px 2px", fontSize: 13, color: "var(--color-neutral-700)" }}>
                {showHistory ? "Todavía no cerraste ningún evento." : search.trim() ? "Ningún evento con ese nombre." : "No tenés eventos activos."}
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn btn-outline btn-block"
            style={{ marginTop: 18 }}
            onClick={() => {
              setShowHistory((h) => !h);
              setSearch("");
            }}
          >
            {showHistory ? "Volver a eventos activos" : "Historial de eventos cerrados"}
          </button>
        </div>
      )}

      {newEventOpen && <EventModal meId={meId} users={users} onClose={() => setNewEventOpen(false)} />}
    </div>
  );
}

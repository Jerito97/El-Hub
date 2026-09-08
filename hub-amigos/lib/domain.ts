// Pure, DB-free domain logic -- ported from the balancesFor/settleFor/
// notifications logic in the original Claude Design prototype
// (project/Hub Amigos.dc.html). Safe to import from server or client code.

import { daysUntil, dateLabel, initialsOf, money, pad } from "./format";
import type { AppState, EventRow, PersonKind, PersonRow, UserRow } from "./types";

export function uname(users: UserRow[], id: string | null | undefined) {
  return users.find((u) => u.id === id)?.name ?? "?";
}

/** Net balance per participant: positive = owed to them, negative = they owe. */
export function balancesFor(ev: EventRow): Record<string, number> {
  const net: Record<string, number> = {};
  ev.participants.forEach((p) => {
    net[p] = 0;
  });
  (ev.payments || []).forEach((p) => {
    net[p.from_id] = (net[p.from_id] || 0) + p.amount;
    net[p.to_id] = (net[p.to_id] || 0) - p.amount;
  });
  ev.expenses.forEach((x) => {
    net[x.payer_id] = (net[x.payer_id] || 0) + x.amount;
    const each = x.amount / x.shares.length;
    x.shares.forEach((s) => {
      net[s] = (net[s] || 0) - each;
    });
  });
  return net;
}

export interface Settlement {
  fromId: string;
  from: string;
  toId: string;
  to: string;
  amount: number;
}

/** Greedy debt-simplification: who should pay whom to settle an event. */
export function settleFor(ev: EventRow, users: UserRow[]): Settlement[] {
  const net = balancesFor(ev);
  const debt = Object.keys(net)
    .filter((k) => net[k] < -1)
    .map((id) => ({ id, v: -net[id] }))
    .sort((a, b) => b.v - a.v);
  const cred = Object.keys(net)
    .filter((k) => net[k] > 1)
    .map((id) => ({ id, v: net[id] }))
    .sort((a, b) => b.v - a.v);
  const out: Settlement[] = [];
  let i = 0,
    j = 0;
  while (i < debt.length && j < cred.length) {
    const amt = Math.min(debt[i].v, cred[j].v);
    out.push({ fromId: debt[i].id, from: uname(users, debt[i].id), toId: cred[j].id, to: uname(users, cred[j].id), amount: amt });
    debt[i].v -= amt;
    cred[j].v -= amt;
    if (debt[i].v < 1) i++;
    if (cred[j].v < 1) j++;
  }
  return out;
}

export interface PersonView {
  id: string;
  name: string;
  initials: string;
  days: number;
  linked: boolean;
  isMe: boolean;
  isToday: boolean;
  dateLabel: string;
  daysLabel: string;
  canEdit: boolean;
  isPrivate: boolean;
  isAniv: boolean;
  chipBg: string;
  chipFg: string;
  ageLabel: string;
  year: number;
  month: number;
  day: number;
  kind: PersonKind;
  userId: string | null;
  addedById: string;
  remind: boolean;
}

function todayMidnight(today: Date) {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

/** The "Fechas" list: visible people/anniversaries, sorted by days-until, with display fields. */
export function computePeople(people: PersonRow[], users: UserRow[], meId: string, today: Date): PersonView[] {
  const t0 = todayMidnight(today);
  return people
    .filter((p) => !p.is_private || p.added_by_id === meId)
    .map((p) => {
      const days = daysUntil(p.month, p.day, today);
      const isAniv = p.kind === "aniversario";
      const dateThisYear = new Date(t0.getFullYear(), p.month - 1, p.day);
      const targetYear = days === 0 ? t0.getFullYear() : dateThisYear < t0 ? t0.getFullYear() + 1 : t0.getFullYear();
      return {
        id: p.id,
        name: p.name,
        initials: initialsOf(p.name),
        days,
        linked: !!p.user_id,
        isMe: p.user_id === meId,
        isToday: days === 0,
        dateLabel: dateLabel(p.day, p.month, p.year),
        daysLabel: days === 0 ? "¡hoy!" : days === 1 ? "mañana" : `faltan ${days} días`,
        canEdit: p.added_by_id === meId || p.user_id === meId,
        isPrivate: p.is_private,
        isAniv,
        chipBg: isAniv ? "var(--color-text)" : "var(--color-accent-600)",
        chipFg: isAniv ? "var(--color-bg)" : "#fff",
        ageLabel: (isAniv ? "" : "cumple ") + (targetYear - p.year) + (isAniv ? " años" : ""),
        year: p.year,
        month: p.month,
        day: p.day,
        kind: p.kind,
        userId: p.user_id,
        addedById: p.added_by_id,
        remind: p.remind,
      };
    })
    .sort((a, b) => a.days - b.days);
}

export interface ConsolidatedRow {
  name: string;
  otherId: string;
  initials: string;
  net: number;
  stateLabel: string;
  amountLabel: string;
  amountColor: string;
  rows: { event: string; eventId: string; amount: number; dir: "debe" | "debo" }[];
}

/** "Balance" tab: net owed/owing per other person, aggregated across my open events. */
export function computeConsolidated(myEvents: EventRow[], users: UserRow[], meId: string): ConsolidatedRow[] {
  const meName = uname(users, meId);
  const agg = new Map<string, { otherId: string; net: number; rows: ConsolidatedRow["rows"] }>();
  myEvents.forEach((e) => {
    settleFor(e, users).forEach((b) => {
      const isMineOwed = b.to === meName;
      const isMineOwing = b.from === meName;
      if (!isMineOwed && !isMineOwing) return;
      const other = isMineOwing ? b.to : b.from;
      const otherId = isMineOwing ? b.toId : b.fromId;
      const dir = isMineOwing ? -1 : 1;
      if (!agg.has(other)) agg.set(other, { otherId, net: 0, rows: [] });
      const a = agg.get(other)!;
      a.net += dir * b.amount;
      a.rows.push({ event: e.name, eventId: e.id, amount: b.amount, dir: dir > 0 ? "debe" : "debo" });
    });
  });
  return Array.from(agg.entries())
    .sort((a, b) => Math.abs(b[1].net) - Math.abs(a[1].net))
    .map(([name, v]) => ({
      name,
      otherId: v.otherId,
      initials: initialsOf(name),
      net: v.net,
      stateLabel: v.net > 1 ? "te debe" : v.net < -1 ? "le debés" : "estás a mano",
      amountLabel: Math.abs(v.net) < 1 ? "" : money(Math.abs(v.net)),
      amountColor: v.net < -1 ? "var(--color-accent-700)" : "var(--color-text)",
      rows: v.rows,
    }));
}

export function myOpenEvents(events: EventRow[], meId: string) {
  return events.filter((e) => e.participants.includes(meId) && !e.closed);
}

export function myClosedEvents(events: EventRow[], meId: string) {
  return events.filter((e) => e.participants.includes(meId) && e.closed);
}

export interface NotifItem {
  id: string;
  icon: string;
  kind: "cumple" | "aniversario" | "gasto" | "evento";
  title: string;
  body: string;
  unread: boolean;
}

/** Everything shown in the notifications panel + the unread bubble count. */
export function computeNotifications(state: AppState, today: Date): NotifItem[] {
  const { people, users, events, me, readNotifIds } = state;
  const meId = me.id;
  const out: NotifItem[] = [];

  people
    .filter((p) => (!p.is_private || p.added_by_id === meId) && p.user_id !== meId && p.remind)
    .map((p) => ({ p, days: daysUntil(p.month, p.day, today) }))
    .filter((x) => x.days === 0)
    .forEach((x) => {
      const isAniv = x.p.kind === "aniversario";
      const id = "b_" + x.p.id;
      out.push({
        id,
        icon: isAniv ? "◈" : "★",
        kind: isAniv ? "aniversario" : "cumple",
        title: isAniv ? `Aniversario de ${x.p.name}, hoy` : `${x.p.name} cumple hoy`,
        body: `${pad(x.p.day)}/${pad(x.p.month)} · tocá para ver el detalle`,
        unread: !readNotifIds.includes(id),
      });
    });

  const myEvents = myOpenEvents(events, meId);
  const consolidated = computeConsolidated(myEvents, users, meId);
  consolidated
    .filter((c) => c.amountLabel)
    .forEach((c) => {
      const id = "d_" + c.name;
      out.push({
        id,
        icon: "$",
        kind: "gasto",
        title: c.stateLabel === "le debés" ? `Le debés ${c.amountLabel} a ${c.name}` : `${c.name} te debe ${c.amountLabel}`,
        body: "Saldo consolidado de los eventos abiertos",
        unread: !readNotifIds.includes(id),
      });
    });

  myEvents.slice(0, 2).forEach((e) => {
    const id = "e_" + e.id;
    out.push({
      id,
      icon: "◇",
      kind: "evento",
      title: `Evento abierto: ${e.name}`,
      body: `${e.expenses.length} gastos cargados · ${e.participants.length} personas`,
      unread: !readNotifIds.includes(id),
    });
  });

  return out;
}

export interface EventListItem {
  id: string;
  name: string;
  dateLabel: string;
  participantsLabel: string;
  avatarInitials: string[];
  balanceKind: string;
  balanceAmountLabel: string;
  balanceColor: string;
  totalLabel: string;
  closed: boolean;
}

export function eventListView(events: EventRow[], users: UserRow[], meId: string): EventListItem[] {
  return events.map((e) => {
    const net = balancesFor(e)[meId] || 0;
    const total = e.expenses.reduce((a, x) => a + x.amount, 0);
    const created = new Date(e.created_at);
    return {
      id: e.id,
      name: e.name,
      dateLabel: `${created.getDate()} ${["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"][created.getMonth()]}`,
      participantsLabel: `${e.participants.length} personas`,
      avatarInitials: e.participants.slice(0, 4).map((p) => initialsOf(uname(users, p))),
      balanceKind: net > 1 ? "te deben" : net < -1 ? "debés" : "al día",
      balanceAmountLabel: Math.abs(net) < 1 ? "—" : money(Math.abs(net)),
      balanceColor: net < -1 ? "var(--color-accent)" : "var(--color-text)",
      totalLabel: "total " + money(total),
      closed: e.closed,
    };
  });
}

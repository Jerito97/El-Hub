import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getFullState } from "@/lib/data";
import { balancesFor, settleFor, uname } from "@/lib/domain";
import { MONTHS_SHORT, initialsOf, money } from "@/lib/format";
import { EventDetailClient } from "./EventDetailClient";

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const me = (await getCurrentUser())!;
  const state = await getFullState(me.id);
  const ev = state.events.find((e) => e.id === eventId);
  if (!ev || !ev.participants.includes(me.id)) notFound();

  const settlements = settleFor(ev, state.users);
  const net = balancesFor(ev);
  const myDebts = settlements
    .filter((b) => b.fromId === me.id)
    .map((b) => ({ toId: b.toId, to: b.to, isGuest: b.toIsGuest, initials: initialsOf(b.to), amount: b.amount, alias: state.users.find((u) => u.id === b.toId)?.alias || "" }));
  const owedToMe = settlements
    .filter((b) => b.toId === me.id)
    .map((b) => ({ fromId: b.fromId, from: b.from, isGuest: b.fromIsGuest, initials: initialsOf(b.from), amount: b.amount }));

  const myNet = net[me.id] || 0;
  const payButtonLabel = myNet < -1 ? `Pagar ${money(-myNet)}` : "Pagar";

  const created = new Date(ev.created_at);
  const eventDateLabel = `${created.getDate()} ${MONTHS_SHORT[created.getMonth()]}`;
  const eventTotal = ev.expenses.reduce((a, x) => a + x.amount, 0);

  const realParticipants = ev.participants
    .filter((id) => !state.users.find((u) => u.id === id)?.is_guest)
    .map((id) => ({ id, name: uname(state.users, id), shares: ev.participantShares[id] ?? 1 }));

  const guests = state.users
    .filter((u) => u.is_guest && ev.participants.includes(u.id))
    .map((g) => {
      const collector = state.users.find((u) => u.id === g.collector_id);
      return {
        id: g.id,
        name: g.name,
        shares: ev.participantShares[g.id] ?? 1,
        collectorId: g.collector_id || "",
        collectorName: collector ? collector.name : "?",
        collectorAlias: collector?.alias || "",
        owed: Math.max(0, -(net[g.id] || 0)),
      };
    });

  return (
    <EventDetailClient
      eventId={ev.id}
      meId={me.id}
      eventName={ev.name}
      eventDateLabel={eventDateLabel}
      eventParticipantsLabel={ev.participants.map((p) => uname(state.users, p)).join(", ")}
      eventCreatorLabel={`Creado por ${ev.created_by === me.id ? "vos" : uname(state.users, ev.created_by)}`}
      eventIsClosed={ev.closed}
      payButtonLabel={payButtonLabel}
      myDebts={myDebts}
      owedToMe={owedToMe}
      settlements={settlements}
      payments={ev.payments.map((p) => ({ id: p.id, from: uname(state.users, p.from_id), to: uname(state.users, p.to_id), amount: p.amount }))}
      participants={ev.participants.map((id) => ({ id, name: uname(state.users, id), isGuest: !!state.users.find((u) => u.id === id)?.is_guest }))}
      participantShares={ev.participantShares}
      realParticipants={realParticipants}
      guests={guests}
      allUsers={state.users.filter((u) => !u.is_guest).map((u) => ({ id: u.id, name: u.name }))}
      eventCreatorId={ev.created_by}
      eventTotal={eventTotal}
      eventExpenses={ev.expenses.map((x) => ({
        id: x.id,
        desc: x.description,
        amount: x.amount,
        payerId: x.payer_id,
        payer: uname(state.users, x.payer_id),
        payerInitials: initialsOf(uname(state.users, x.payer_id)),
        shareIds: x.shares,
        sharesLabel: x.shares.length === ev.participants.length ? `entre los ${x.shares.length}` : `entre ${x.shares.map((s) => uname(state.users, s)).join(", ")}`,
      }))}
      canCloseEvent={ev.created_by === me.id && settlements.length === 0 && !ev.closed}
      closeBlocked={ev.created_by === me.id && settlements.length > 0 && !ev.closed}
    />
  );
}

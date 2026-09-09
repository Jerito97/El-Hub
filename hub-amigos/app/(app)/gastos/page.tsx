import { getCurrentUser } from "@/lib/auth";
import { getFullState } from "@/lib/data";
import { computeConsolidated, eventListView, myClosedEvents, myOpenEvents } from "@/lib/domain";
import { GastosClient } from "./GastosClient";

export default async function GastosPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  const me = (await getCurrentUser())!;
  const state = await getFullState(me.id);

  const open = myOpenEvents(state.events, me.id);
  const closed = myClosedEvents(state.events, me.id);
  const consolidated = computeConsolidated(open, state.users, me.id);

  return (
    <GastosClient
      meId={me.id}
      users={state.users.filter((u) => !u.is_guest).map((u) => ({ id: u.id, name: u.name, alias: u.alias }))}
      openEvents={eventListView(open, state.users, me.id)}
      closedEvents={eventListView(closed, state.users, me.id)}
      consolidated={consolidated}
      initialView={view === "balance" ? "balance" : "eventos"}
    />
  );
}

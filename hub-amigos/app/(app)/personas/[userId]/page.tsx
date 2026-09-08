import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getFullState } from "@/lib/data";
import { computeConsolidated, myOpenEvents } from "@/lib/domain";
import { dateLabel, initialsOf } from "@/lib/format";
import { PersonaDetailClient } from "./PersonaDetailClient";

export default async function PersonaDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const me = (await getCurrentUser())!;
  const state = await getFullState(me.id);
  const user = state.users.find((u) => u.id === userId);
  if (!user) notFound();

  const person = state.people.find((p) => p.user_id === user.id);
  const open = myOpenEvents(state.events, me.id);
  const shared = open.filter((e) => e.participants.includes(user.id));
  const consolidated = computeConsolidated(open, state.users, me.id);
  const row = consolidated.find((c) => c.name === user.name);

  return (
    <PersonaDetailClient
      initials={initialsOf(user.name)}
      name={user.name}
      birthday={person ? dateLabel(person.day, person.month, person.year) : "sin cargar"}
      alias={user.alias}
      stateLabel={row ? row.stateLabel : "estás a mano"}
      amountLabel={row ? row.amountLabel : ""}
      amountColor={row ? row.amountColor : "var(--color-text)"}
      sharedLabel={shared.length === 1 ? "1 evento activo en común" : `${shared.length} eventos activos en común`}
    />
  );
}

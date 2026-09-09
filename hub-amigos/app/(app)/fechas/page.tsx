import { getCurrentUser } from "@/lib/auth";
import { getFullState } from "@/lib/data";
import { computePeople } from "@/lib/domain";
import { nowInAppTz } from "@/lib/format";
import { FechasClient } from "./FechasClient";

export default async function FechasPage() {
  const me = (await getCurrentUser())!;
  const state = await getFullState(me.id);
  const today = nowInAppTz();
  const people = computePeople(state.people, state.users, me.id, today);

  return <FechasClient people={people} today={{ day: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear() }} />;
}

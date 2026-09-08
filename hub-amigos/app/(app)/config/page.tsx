import { getCurrentUser } from "@/lib/auth";
import { getFullState } from "@/lib/data";
import { ConfigClient } from "./ConfigClient";

export default async function ConfigPage() {
  const me = (await getCurrentUser())!;
  const state = await getFullState(me.id);
  const person = state.people.find((p) => p.user_id === me.id);

  return (
    <ConfigClient
      prefs={state.prefs}
      profileInitial={{
        name: me.name,
        alias: me.alias,
        day: person ? String(person.day) : "",
        month: person ? String(person.month) : "",
        year: person ? String(person.year) : "",
      }}
    />
  );
}

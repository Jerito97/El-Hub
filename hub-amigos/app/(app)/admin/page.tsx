import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getFullState } from "@/lib/data";
import { AdminClient } from "./AdminClient";

export default async function AdminPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (!me.is_admin) redirect("/home");

  const state = await getFullState(me.id);

  return <AdminClient meId={me.id} users={state.users} people={state.people} events={state.events} />;
}

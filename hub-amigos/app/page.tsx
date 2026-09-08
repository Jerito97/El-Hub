import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function RootPage() {
  const me = await getCurrentUser();
  redirect(me ? "/home" : "/login");
}

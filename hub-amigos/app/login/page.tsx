import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginClient } from "./LoginClient";

export default async function LoginPage() {
  const me = await getCurrentUser();
  if (me) redirect("/home");
  return <LoginClient />;
}

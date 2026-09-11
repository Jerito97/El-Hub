import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getFullState } from "@/lib/data";
import { computeNotifications } from "@/lib/domain";
import { dateLabel, initialsOf, nowInAppTz } from "@/lib/format";
import { AppShellProvider } from "@/lib/client/AppShellContext";
import { ThemeSync } from "@/lib/client/ThemeSync";
import { EdgeSwipe } from "@/lib/client/EdgeSwipe";
import { Header } from "@/components/Header";
import { Drawer } from "@/components/Drawer";
import { NotificationsPanel, type NotifWithHref } from "@/components/NotificationsPanel";
import { TabBar } from "@/components/TabBar";

/** Where tapping a notification should navigate. Event notifs encode their event id as "e_<id>" (see computeNotifications in lib/domain), so slice(2) recovers it. */
function hrefFor(notif: { id: string; kind: string }): string {
  if (notif.kind === "cumple" || notif.kind === "aniversario") return "/fechas";
  if (notif.kind === "gasto") return "/gastos?view=balance";
  if (notif.kind === "evento") return `/gastos/${notif.id.slice(2)}`;
  return "/home";
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const state = await getFullState(me.id);
  const notifs: NotifWithHref[] = computeNotifications(state, nowInAppTz()).map((n) => ({ ...n, href: hrefFor(n) }));
  const unreadCount = notifs.filter((n) => n.unread).length;
  const myBirthday = state.people.find((p) => p.user_id === me.id);

  return (
    <AppShellProvider>
      <ThemeSync theme={state.prefs.theme} />
      <EdgeSwipe />
      <div className="hub-app">
        <Header meId={me.id} meInitials={initialsOf(me.name)} unreadCount={unreadCount} />
        <Drawer
          meId={me.id}
          meName={me.name}
          meInitials={initialsOf(me.name)}
          meBirthdayLabel={myBirthday ? dateLabel(myBirthday.day, myBirthday.month, myBirthday.year) : "sin cargar"}
          isAdmin={me.is_admin}
        />
        <NotificationsPanel notifs={notifs} />
        <div className="hub-scroll" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          {children}
        </div>
        <TabBar />
      </div>
    </AppShellProvider>
  );
}

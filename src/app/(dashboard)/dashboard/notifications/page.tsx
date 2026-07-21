import { AppPageHero } from "@/components/common";
import { requireActiveUser } from "@/features/auth/services/session";
import {
  getNotificationPreferences,
  listNotifications,
} from "@/features/notifications/services";
import {
  NotificationPreferencesForm,
  NotificationsList,
} from "@/features/notifications/components";

export default async function NotificationsPage() {
  const user = await requireActiveUser();
  const [list, preferences] = await Promise.all([
    listNotifications(user.id, { page: "1", pageSize: "50" }),
    getNotificationPreferences(user.id),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <AppPageHero
        variant="notifications"
        title="Notifications"
        description="Centre de notifications — alertes entretien, voyages et budget."
        breadcrumb={<span>Espace client · Notifications</span>}
      />
      <NotificationsList items={list.items} unreadCount={list.unreadCount} />
      <section className="border-sebavio-sand/50 bg-card/90 dark:bg-card/70 flex flex-col gap-3 rounded-[var(--radius-card)] border p-4 shadow-[var(--shadow-sm)] sm:p-5 dark:border-white/10">
        <h2 className="font-heading text-lg font-semibold">Préférences</h2>
        <p className="text-muted-foreground text-sm">
          L’interrupteur global reste dans Paramètres. Ici : canaux et types.
        </p>
        <NotificationPreferencesForm preferences={preferences} />
      </section>
    </div>
  );
}

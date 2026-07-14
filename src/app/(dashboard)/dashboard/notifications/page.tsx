import { PageHeader } from "@/components/common";
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
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Notifications"
        description="Centre de notifications in-app — alertes entretien, voyages et budget."
      />
      <NotificationsList items={list.items} unreadCount={list.unreadCount} />
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Préférences</h2>
        <p className="text-muted-foreground text-sm">
          L’interrupteur global reste dans Paramètres. Ici : canaux et types.
        </p>
        <NotificationPreferencesForm preferences={preferences} />
      </section>
    </div>
  );
}

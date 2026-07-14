"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  deleteNotificationAction,
  markAllReadAction,
  markReadAction,
  type NotificationsActionResult,
} from "@/features/notifications/actions";
import type { NotificationDto } from "@/features/notifications/types";
import { EmptyState } from "@/components/common";
import { Badge, Button } from "@/components/ui";

const initial: NotificationsActionResult | undefined = undefined;

const TYPE_LABELS: Record<string, string> = {
  maintenance: "Entretien",
  trip: "Voyage",
  budget: "Budget",
  weather: "Météo",
  fuel: "Carburant",
};

type NotificationsListProps = {
  items: NotificationDto[];
  unreadCount: number;
};

export function NotificationsList({
  items,
  unreadCount,
}: NotificationsListProps) {
  const [, markAllAction, markAllPending] = useActionState(
    markAllReadAction,
    initial,
  );

  if (items.length === 0) {
    return (
      <EmptyState
        title="Aucune notification"
        description="Les rappels d’entretien, voyages à venir et alertes budget apparaîtront ici."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {unreadCount > 0 ? (
        <form action={markAllAction}>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={markAllPending}
          >
            {markAllPending ? "…" : "Tout marquer comme lu"}
          </Button>
        </form>
      ) : null}
      <ul className="divide-border divide-y rounded-lg border">
        {items.map((item) => (
          <NotificationRow key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}

function NotificationRow({ item }: { item: NotificationDto }) {
  const [, readAction, readPending] = useActionState(markReadAction, initial);
  const [, deleteAction, deletePending] = useActionState(
    deleteNotificationAction,
    initial,
  );
  const unread = !item.readAt;

  return (
    <li
      className={
        unread
          ? "bg-muted/40 flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
          : "flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
      }
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {TYPE_LABELS[item.type] ?? item.type}
          </Badge>
          {unread ? <Badge>Non lu</Badge> : null}
          {item.priority === "high" ? (
            <Badge variant="destructive">Priorité haute</Badge>
          ) : null}
        </div>
        <p className="font-medium">{item.title}</p>
        <p className="text-muted-foreground text-sm">{item.body}</p>
        <p className="text-muted-foreground mt-1 text-xs">
          {new Date(item.createdAt).toLocaleString("fr-CA")}
        </p>
        {item.href ? (
          <Link
            href={item.href}
            className="text-primary mt-1 inline-block text-sm underline-offset-2 hover:underline"
          >
            Voir le détail
          </Link>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-2">
        {unread ? (
          <form action={readAction}>
            <input type="hidden" name="id" value={item.id} />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={readPending}
            >
              Lu
            </Button>
          </form>
        ) : null}
        <form action={deleteAction}>
          <input type="hidden" name="id" value={item.id} />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            disabled={deletePending}
          >
            Supprimer
          </Button>
        </form>
      </div>
    </li>
  );
}

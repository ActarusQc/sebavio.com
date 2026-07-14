import { prisma } from "@/lib/prisma";
import { toDateKey } from "@/features/finance/lib/dates";
import {
  maintenanceDedupeKey,
  tripUpcomingDedupeKey,
  TRIP_UPCOMING_DAYS,
} from "@/features/notifications/constants";
import { createInAppNotification } from "@/features/notifications/services/create";
import { invalidateUnreadCache } from "@/features/notifications/services/badge";
import type { DispatchReport } from "@/features/notifications/types";

function addDaysUtc(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

/**
 * Dispatcher entretien : pour chaque maintenance_notifications sent=false,
 * crée la notif in-app PUIS marque sent=true dans la même transaction.
 * sent=true uniquement si création OK ou déjà présente (dedupe).
 */
export async function dispatchMaintenanceNotifications(
  report: DispatchReport,
): Promise<void> {
  const pending = await prisma.maintenanceNotification.findMany({
    where: { sent: false },
    include: {
      vehicle: { select: { userId: true, nickname: true, deletedAt: true } },
      schedule: { include: { template: true } },
    },
    orderBy: { notificationDate: "asc" },
    take: 500,
  });

  const touchedUsers = new Set<string>();

  for (const row of pending) {
    report.maintenanceProcessed += 1;

    if (row.vehicle.deletedAt) {
      continue;
    }

    const userId = row.vehicle.userId;
    const templateName = row.schedule.template?.title ?? "Entretien";
    const vehicleLabel = row.vehicle.nickname ?? "véhicule";
    const dueLabel = row.notificationDate.toISOString().slice(0, 10);

    try {
      await prisma.$transaction(async (tx) => {
        const result = await createInAppNotification(
          {
            userId,
            type: "maintenance",
            title: "Entretien à venir",
            body: `${templateName} — ${vehicleLabel} (échéance autour du ${dueLabel}).`,
            priority: "high",
            dedupeKey: maintenanceDedupeKey(row.scheduleId),
            sourceEntity: "maintenance_notifications",
            sourceId: row.id,
            href: "/dashboard/maintenance",
          },
          tx,
        );

        if (result.status === "skipped_prefs") {
          report.maintenanceSkippedPrefs += 1;
          // Préférences off : on ne marque pas sent — le rappel reste
          // disponible si l’utilisateur réactive les notifs.
          return;
        }

        if (result.status === "created") {
          report.maintenanceCreated += 1;
          touchedUsers.add(userId);
        } else {
          report.maintenanceAlreadyPresent += 1;
        }

        // Marquage UNIQUEMENT après création réussie ou existence via dedupe.
        await tx.maintenanceNotification.update({
          where: { id: row.id },
          data: { sent: true },
        });
      });
    } catch {
      // Échec transaction : sent reste false → retry au prochain dispatch.
    }
  }

  for (const userId of touchedUsers) {
    await invalidateUnreadCache(userId);
  }
}

/**
 * Voyages à venir (≤ 7 j) :
 * dedupe_key = trip_upcoming:{tripId}:{departure_date}
 * Soft-delete des clés obsolètes (départ modifié), puis création.
 */
export async function dispatchTripUpcomingNotifications(
  report: DispatchReport,
  today: Date = new Date(),
): Promise<void> {
  const dayStart = startOfUtcDay(today);
  const windowEnd = addDaysUtc(dayStart, TRIP_UPCOMING_DAYS);

  const activeTripNotifs = await prisma.notification.findMany({
    where: {
      type: "trip",
      channel: "in_app",
      deletedAt: null,
      dedupeKey: { startsWith: "trip_upcoming:" },
    },
  });

  const tripsById = new Map<
    string,
    {
      id: string;
      userId: string;
      title: string;
      status: string;
      departureDate: Date;
      deletedAt: Date | null;
    }
  >();

  const tripIds = [
    ...new Set(
      activeTripNotifs
        .map((n) => n.sourceId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  if (tripIds.length > 0) {
    const trips = await prisma.trip.findMany({
      where: { id: { in: tripIds } },
      select: {
        id: true,
        userId: true,
        title: true,
        status: true,
        departureDate: true,
        deletedAt: true,
      },
    });
    for (const t of trips) {
      tripsById.set(t.id, t);
    }
  }

  const now = new Date();
  const touchedUsers = new Set<string>();

  for (const notif of activeTripNotifs) {
    const trip = notif.sourceId ? tripsById.get(notif.sourceId) : undefined;
    const expectedKey =
      trip && !trip.deletedAt
        ? tripUpcomingDedupeKey(trip.id, toDateKey(trip.departureDate))
        : null;

    const obsolete =
      !trip ||
      trip.deletedAt != null ||
      trip.status === "completed" ||
      trip.status === "cancelled" ||
      expectedKey !== notif.dedupeKey;

    if (obsolete) {
      await prisma.notification.update({
        where: { id: notif.id },
        data: { deletedAt: now },
      });
      report.tripObsoleteSoftDeleted += 1;
      touchedUsers.add(notif.userId);
    }
  }

  const upcoming = await prisma.trip.findMany({
    where: {
      deletedAt: null,
      status: { in: ["planned", "in_progress"] },
      departureDate: {
        gte: dayStart,
        lte: windowEnd,
      },
    },
    select: {
      id: true,
      userId: true,
      title: true,
      departureDate: true,
    },
  });

  for (const trip of upcoming) {
    const dateKey = toDateKey(trip.departureDate);
    const dedupeKey = tripUpcomingDedupeKey(trip.id, dateKey);
    const result = await createInAppNotification({
      userId: trip.userId,
      type: "trip",
      title: "Voyage à venir",
      body: `« ${trip.title} » commence le ${dateKey}.`,
      priority: "normal",
      dedupeKey,
      sourceEntity: "trips",
      sourceId: trip.id,
      href: `/dashboard/trips/${trip.id}`,
    });

    if (result.status === "created") {
      report.tripCreated += 1;
      touchedUsers.add(trip.userId);
    } else if (result.status === "exists") {
      report.tripAlreadyPresent += 1;
    } else {
      report.tripSkippedPrefs += 1;
    }
  }

  for (const userId of touchedUsers) {
    await invalidateUnreadCache(userId);
  }
}

export async function dispatchNotifications(
  today: Date = new Date(),
): Promise<DispatchReport> {
  const report: DispatchReport = {
    maintenanceProcessed: 0,
    maintenanceCreated: 0,
    maintenanceAlreadyPresent: 0,
    maintenanceSkippedPrefs: 0,
    tripObsoleteSoftDeleted: 0,
    tripCreated: 0,
    tripAlreadyPresent: 0,
    tripSkippedPrefs: 0,
  };

  await dispatchMaintenanceNotifications(report);
  await dispatchTripUpcomingNotifications(report, today);
  return report;
}

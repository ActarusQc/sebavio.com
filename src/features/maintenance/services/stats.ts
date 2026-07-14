import { prisma } from "@/lib/prisma";
import { ODOMETER_STALE_DAYS } from "@/features/maintenance/constants";
import { listUserSchedules } from "@/features/maintenance/services/schedule";
import type {
  MaintenanceDashboardDto,
  MaintenanceStatsDto,
  OdometerFreshnessDto,
} from "@/features/maintenance/types";

function vehicleLabel(row: {
  nickname: string | null;
  model: {
    modelName: string;
    year: number;
    manufacturer: { name: string };
  } | null;
  manualManufacturerName: string | null;
  manualModelName: string | null;
  manualYear: number | null;
}): string {
  if (row.nickname?.trim()) return row.nickname.trim();
  if (row.model) {
    return `${row.model.manufacturer.name} ${row.model.modelName} (${row.model.year})`;
  }
  if (row.manualManufacturerName && row.manualModelName) {
    const year = row.manualYear ? ` (${row.manualYear})` : "";
    return `${row.manualManufacturerName} ${row.manualModelName}${year}`;
  }
  return "Véhicule";
}

export async function getMaintenanceStats(
  userId: string,
): Promise<MaintenanceStatsDto> {
  const vehicles = await prisma.userVehicle.findMany({
    where: { userId, deletedAt: null },
    select: { id: true },
  });
  const vehicleIds = vehicles.map((v) => v.id);

  if (vehicleIds.length === 0) {
    return {
      interventionCount: 0,
      totalCost: "0",
      yearCost: "0",
      upcomingCount: 0,
      overdueCount: 0,
    };
  }

  const yearStart = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));

  const [histories, upcomingCount, overdueCount] = await Promise.all([
    prisma.maintenanceHistory.findMany({
      where: { vehicleId: { in: vehicleIds }, deletedAt: null },
      select: { cost: true, performedDate: true },
    }),
    prisma.maintenanceSchedule.count({
      where: { vehicleId: { in: vehicleIds }, status: "upcoming" },
    }),
    prisma.maintenanceSchedule.count({
      where: { vehicleId: { in: vehicleIds }, status: "overdue" },
    }),
  ]);

  let total = 0;
  let yearTotal = 0;
  for (const h of histories) {
    const c = h.cost ? Number(h.cost.toString()) : 0;
    if (!Number.isFinite(c)) continue;
    total += c;
    if (h.performedDate >= yearStart) yearTotal += c;
  }

  return {
    interventionCount: histories.length,
    totalCost: total.toFixed(2),
    yearCost: yearTotal.toFixed(2),
    upcomingCount,
    overdueCount,
  };
}

export async function getOdometerFreshness(
  userId: string,
): Promise<OdometerFreshnessDto[]> {
  const vehicles = await prisma.userVehicle.findMany({
    where: { userId, deletedAt: null },
    include: {
      model: { include: { manufacturer: { select: { name: true } } } },
    },
  });

  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;

  return vehicles.map((v) => {
    const days = Math.floor((now - v.odometerUpdatedAt.getTime()) / msPerDay);
    return {
      vehicleId: v.id,
      vehicleLabel: vehicleLabel(v),
      odometerUpdatedAt: v.odometerUpdatedAt.toISOString(),
      stale: days > ODOMETER_STALE_DAYS,
      daysSinceUpdate: days,
    };
  });
}

export async function getMaintenanceDashboard(
  userId: string,
): Promise<MaintenanceDashboardDto> {
  const [stats, schedules, odometerHints] = await Promise.all([
    getMaintenanceStats(userId),
    listUserSchedules(userId),
    getOdometerFreshness(userId),
  ]);

  return {
    stats,
    upcoming: schedules.filter((s) => s.status === "upcoming").slice(0, 10),
    overdue: schedules.filter((s) => s.status === "overdue"),
    odometerHints: odometerHints.filter((h) => h.stale),
  };
}

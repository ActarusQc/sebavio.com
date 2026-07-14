import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/features/auth/services/audit";
import { getOwnedTripOrThrow } from "@/features/trips/services";
import {
  DEFAULT_CURRENCY,
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from "@/features/finance/constants";
import { toDateKey } from "@/features/finance/lib/dates";
import {
  addMoney,
  budgetVariance,
  moneyToString,
  toMoney,
} from "@/features/finance/lib/money";
import { budgetUpsertSchema } from "@/features/finance/schemas";
import { upsertTripBudgetAmount } from "@/features/finance/services/budget";
import { toBudgetDto, toExpenseDto } from "@/features/finance/services/mappers";
import type {
  CategoryBreakdownDto,
  FinanceDashboardDto,
  TripBudgetDto,
  TripFinanceSummaryDto,
} from "@/features/finance/types";

function parseZod<T>(parse: () => T, fallbackMessage: string): T {
  try {
    return parse();
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(
        "VALIDATION_ERROR",
        error.issues[0]?.message ?? fallbackMessage,
        400,
      );
    }
    throw error;
  }
}

function emptyBreakdown(): CategoryBreakdownDto[] {
  return EXPENSE_CATEGORIES.map((category) => ({
    category,
    total: "0.00",
    count: 0,
  }));
}

function buildBreakdown(
  rows: Array<{ category: string; amount: { toString(): string } }>,
): CategoryBreakdownDto[] {
  const map = new Map<
    ExpenseCategory,
    { total: ReturnType<typeof toMoney>; count: number }
  >();
  for (const cat of EXPENSE_CATEGORIES) {
    map.set(cat, { total: toMoney(0), count: 0 });
  }
  for (const row of rows) {
    const cat = row.category as ExpenseCategory;
    const bucket = map.get(cat);
    if (!bucket) continue;
    bucket.total = addMoney(bucket.total, row.amount.toString());
    bucket.count += 1;
  }
  return EXPENSE_CATEGORIES.map((category) => {
    const bucket = map.get(category)!;
    return {
      category,
      total: moneyToString(bucket.total),
      count: bucket.count,
    };
  }).filter((b) => b.count > 0);
}

export async function getTripBudget(
  userId: string,
  tripId: string,
): Promise<TripBudgetDto> {
  const trip = await getOwnedTripOrThrow(userId, tripId);
  const budget = await prisma.tripBudget.findUnique({
    where: { tripId },
    include: { trip: { select: { plannedBudget: true } } },
  });
  if (!budget) {
    throw new AppError("FIN_001", "Budget introuvable", 404);
  }
  return toBudgetDto({
    ...budget,
    trip: { plannedBudget: trip.plannedBudget },
  });
}

export async function upsertTripBudget(
  userId: string,
  tripId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<TripBudgetDto> {
  await getOwnedTripOrThrow(userId, tripId);
  const input = parseZod(
    () => budgetUpsertSchema.parse(raw),
    "Budget invalide",
  );

  const budget = await prisma.$transaction(async (tx) => {
    const row = await upsertTripBudgetAmount(
      tx,
      tripId,
      input.plannedAmount,
      input.currency,
    );
    if (!row) {
      throw new AppError("FIN_001", "Budget introuvable", 404);
    }
    return row;
  });

  await writeAuditLog({
    userId,
    entity: "trip_budgets",
    entityId: budget.id,
    action: "upsert",
    newValue: {
      tripId,
      plannedAmount: budget.plannedAmount.toString(),
      currency: budget.currency,
    },
    ipAddress,
  });

  const trip = await prisma.trip.findUniqueOrThrow({
    where: { id: tripId },
    select: { plannedBudget: true },
  });

  return toBudgetDto({ ...budget, trip });
}

export async function getTripFinanceSummary(
  userId: string,
  tripId: string,
): Promise<TripFinanceSummaryDto> {
  const trip = await getOwnedTripOrThrow(userId, tripId);

  const departureKey = toDateKey(trip.departureDate);
  const returnKey = trip.returnDate ? toDateKey(trip.returnDate) : null;

  const filledAtFilter = returnKey
    ? {
        gte: new Date(`${departureKey}T00:00:00.000Z`),
        lte: new Date(`${returnKey}T23:59:59.999Z`),
      }
    : { gte: new Date(`${departureKey}T00:00:00.000Z`) };

  const performedDateFilter = returnKey
    ? {
        gte: new Date(`${departureKey}T00:00:00.000Z`),
        lte: new Date(`${returnKey}T23:59:59.999Z`),
      }
    : { gte: new Date(`${departureKey}T00:00:00.000Z`) };

  const [expenses, fuelLogs, maintenance, budget, route] = await Promise.all([
    prisma.expense.findMany({
      where: { tripId, deletedAt: null },
      orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
    }),
    prisma.fuelLog.findMany({
      where: {
        vehicleId: trip.vehicleId,
        deletedAt: null,
        filledAt: filledAtFilter,
        vehicle: { userId, deletedAt: null },
      },
      include: {
        expense: { select: { id: true, deletedAt: true } },
      },
      orderBy: { filledAt: "desc" },
    }),
    prisma.maintenanceHistory.findMany({
      where: {
        vehicleId: trip.vehicleId,
        deletedAt: null,
        performedDate: performedDateFilter,
        vehicle: { userId, deletedAt: null },
      },
      orderBy: { performedDate: "desc" },
      take: 20,
    }),
    prisma.tripBudget.findUnique({ where: { tripId } }),
    prisma.tripRoute.findUnique({
      where: { tripId },
      select: { estimatedFuelCost: true },
    }),
  ]);

  const plannedAmount = budget
    ? moneyToString(budget.plannedAmount)
    : trip.plannedBudget
      ? moneyToString(trip.plannedBudget)
      : null;

  const actual = expenses.reduce(
    (acc, e) => addMoney(acc, e.amount.toString()),
    toMoney(0),
  );
  const actualTotal = moneyToString(actual);

  const stops = await prisma.tripStop.findMany({
    where: { tripId },
    include: {
      campground: {
        select: {
          name: true,
          priceMin: true,
          priceMax: true,
          deletedAt: true,
        },
      },
      stopActivities: {
        where: { deletedAt: null },
        include: {
          activity: {
            select: {
              name: true,
              priceIndicative: true,
              deletedAt: true,
            },
          },
        },
      },
    },
    orderBy: { sequence: "asc" },
  });

  const campingPriceHints = stops
    .filter((s) => s.campground && !s.campground.deletedAt)
    .map((s) => ({
      stopName: s.name,
      campgroundName: s.campground!.name,
      priceMin: s.campground!.priceMin
        ? moneyToString(s.campground!.priceMin)
        : null,
      priceMax: s.campground!.priceMax
        ? moneyToString(s.campground!.priceMax)
        : null,
    }));

  const activityPriceHints = stops.flatMap((s) =>
    s.stopActivities
      .filter((a) => a.activity && !a.activity.deletedAt)
      .map((a) => ({
        stopName: s.name,
        activityName: a.activity.name,
        priceIndicative: a.activity.priceIndicative
          ? moneyToString(a.activity.priceIndicative)
          : null,
      })),
  );

  return {
    tripId: trip.id,
    tripTitle: trip.title,
    currency: budget?.currency ?? DEFAULT_CURRENCY,
    plannedAmount,
    actualTotal,
    variance: budgetVariance(plannedAmount, actualTotal),
    byCategory: buildBreakdown(expenses),
    expenseCount: expenses.length,
    estimatedFuelCost: route?.estimatedFuelCost
      ? moneyToString(route.estimatedFuelCost)
      : null,
    referenceFuelLogs: fuelLogs.map((log) => {
      const activeImport =
        log.expense && !log.expense.deletedAt ? log.expense : null;
      return {
        id: log.id,
        filledAt: toDateKey(log.filledAt),
        totalCost: moneyToString(log.totalCost),
        liters: log.liters.toString(),
        stationName: log.stationName,
        alreadyImported: Boolean(activeImport),
        importedExpenseId: activeImport?.id ?? null,
      };
    }),
    referenceMaintenance: maintenance.map((h) => ({
      id: h.id,
      performedDate: toDateKey(h.performedDate),
      cost: h.cost ? moneyToString(h.cost) : null,
      currency: h.currency,
      provider: h.provider,
    })),
    campingPriceHints,
    activityPriceHints,
  };
}

export async function getFinanceDashboard(
  userId: string,
): Promise<FinanceDashboardDto> {
  const trips = await prisma.trip.findMany({
    where: { userId, deletedAt: null },
    include: {
      budget: true,
      expenses: { where: { deletedAt: null } },
    },
    orderBy: [{ departureDate: "desc" }, { createdAt: "desc" }],
  });

  const tripSummaries = trips.map((trip) => {
    const plannedAmount = trip.budget
      ? moneyToString(trip.budget.plannedAmount)
      : trip.plannedBudget
        ? moneyToString(trip.plannedBudget)
        : null;
    const actual = trip.expenses.reduce(
      (acc, e) => addMoney(acc, e.amount.toString()),
      toMoney(0),
    );
    const actualTotal = moneyToString(actual);
    return {
      tripId: trip.id,
      title: trip.title,
      status: trip.status,
      plannedAmount,
      actualTotal,
      variance: budgetVariance(plannedAmount, actualTotal),
      expenses: trip.expenses,
    };
  });

  const allExpenses = tripSummaries.flatMap((t) => t.expenses);
  const totalActualDec = allExpenses.reduce(
    (acc, e) => addMoney(acc, e.amount.toString()),
    toMoney(0),
  );
  const totalPlannedDec = tripSummaries.reduce((acc, t) => {
    if (t.plannedAmount == null) return acc;
    return addMoney(acc, t.plannedAmount);
  }, toMoney(0));

  const recent = await prisma.expense.findMany({
    where: { deletedAt: null, trip: { userId, deletedAt: null } },
    include: { receipts: true },
    orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
    take: 10,
  });

  const totalActual = moneyToString(totalActualDec);
  const totalPlanned = moneyToString(totalPlannedDec);

  return {
    currency: DEFAULT_CURRENCY,
    tripCount: trips.length,
    totalPlanned,
    totalActual,
    variance: moneyToString(toMoney(totalPlannedDec).minus(totalActualDec)),
    byCategory:
      allExpenses.length > 0 ? buildBreakdown(allExpenses) : emptyBreakdown(),
    trips: tripSummaries.map(({ expenses: _ignored, ...rest }) => {
      void _ignored;
      return rest;
    }),
    recentExpenses: recent.map(toExpenseDto),
  };
}

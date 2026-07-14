import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/features/auth/services/audit";
import { getOwnedTripOrThrow } from "@/features/trips/services";
import { DEFAULT_CURRENCY, MAX_PAGE_SIZE } from "@/features/finance/constants";
import {
  isExpenseDateOutsideTripPeriod,
  OUT_OF_PERIOD_WARNING,
} from "@/features/finance/lib/dates";
import { toMoney } from "@/features/finance/lib/money";
import {
  expenseCreateSchema,
  expenseReceiptSchema,
  expensesListSchema,
  expenseUpdateSchema,
  importFuelExpenseSchema,
  type ExpenseCreateInput,
  type ExpenseUpdateInput,
} from "@/features/finance/schemas";
import {
  clampPageSize,
  toExpenseDto,
  toReceiptDto,
} from "@/features/finance/services/mappers";
import type {
  ExpenseDto,
  ExpenseReceiptDto,
  ExpenseWriteResult,
  PaginatedExpenses,
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

const expenseInclude = {
  receipts: { orderBy: { createdAt: "desc" as const } },
} as const;

function collectDateWarnings(
  expenseDate: Date,
  departureDate: Date,
  returnDate: Date | null,
): string[] {
  if (isExpenseDateOutsideTripPeriod(expenseDate, departureDate, returnDate)) {
    return [OUT_OF_PERIOD_WARNING];
  }
  return [];
}

export async function getOwnedExpenseOrThrow(
  userId: string,
  expenseId: string,
) {
  const row = await prisma.expense.findFirst({
    where: {
      id: expenseId,
      deletedAt: null,
      trip: { userId, deletedAt: null },
    },
    include: expenseInclude,
  });
  if (!row) {
    throw new AppError("FIN_002", "Dépense introuvable", 404);
  }
  return row;
}

export async function listExpenses(
  userId: string,
  rawQuery: Record<string, string | string[] | undefined>,
): Promise<PaginatedExpenses> {
  const query = Object.fromEntries(
    Object.entries(rawQuery).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const parsed = parseZod(
    () => expensesListSchema.parse(query),
    "Paramètres de liste invalides",
  );
  const pageSize = clampPageSize(parsed.pageSize, MAX_PAGE_SIZE);
  const page = parsed.page;

  if (parsed.tripId) {
    await getOwnedTripOrThrow(userId, parsed.tripId);
  }

  const where = {
    deletedAt: null,
    trip: { userId, deletedAt: null },
    ...(parsed.tripId ? { tripId: parsed.tripId } : {}),
    ...(parsed.category ? { category: parsed.category } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      include: expenseInclude,
      orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: rows.map(toExpenseDto),
    page,
    pageSize,
    total,
  };
}

export async function getExpenseById(
  userId: string,
  expenseId: string,
): Promise<ExpenseDto> {
  const row = await getOwnedExpenseOrThrow(userId, expenseId);
  return toExpenseDto(row);
}

export async function createExpense(
  userId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<ExpenseWriteResult> {
  const input: ExpenseCreateInput = parseZod(
    () => expenseCreateSchema.parse(raw),
    "Dépense invalide",
  );

  const trip = await getOwnedTripOrThrow(userId, input.tripId);
  const amount = toMoney(input.amount);
  const currency = input.currency ?? DEFAULT_CURRENCY;

  const created = await prisma.expense.create({
    data: {
      tripId: input.tripId,
      category: input.category,
      amount,
      currency,
      expenseDate: input.expenseDate,
      merchant: input.merchant ?? null,
      notes: input.notes ?? null,
    },
    include: expenseInclude,
  });

  await writeAuditLog({
    userId,
    entity: "expenses",
    entityId: created.id,
    action: "create",
    newValue: {
      tripId: created.tripId,
      category: created.category,
      amount: created.amount.toString(),
      currency: created.currency,
    },
    ipAddress,
  });

  const { syncBudgetExceededNotification } =
    await import("@/features/notifications/services/budget-sync");
  await syncBudgetExceededNotification(userId, input.tripId);

  return {
    expense: toExpenseDto(created),
    warnings: collectDateWarnings(
      created.expenseDate,
      trip.departureDate,
      trip.returnDate,
    ),
  };
}

export async function updateExpense(
  userId: string,
  expenseId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<ExpenseWriteResult> {
  const existing = await getOwnedExpenseOrThrow(userId, expenseId);
  const trip = await getOwnedTripOrThrow(userId, existing.tripId);
  const input: ExpenseUpdateInput = parseZod(
    () => expenseUpdateSchema.parse(raw),
    "Dépense invalide",
  );

  const updated = await prisma.expense.update({
    where: { id: expenseId },
    data: {
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.amount !== undefined ? { amount: toMoney(input.amount) } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.expenseDate !== undefined
        ? { expenseDate: input.expenseDate }
        : {}),
      ...(input.merchant !== undefined ? { merchant: input.merchant } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
    include: expenseInclude,
  });

  await writeAuditLog({
    userId,
    entity: "expenses",
    entityId: expenseId,
    action: "update",
    oldValue: {
      category: existing.category,
      amount: existing.amount.toString(),
    },
    newValue: {
      category: updated.category,
      amount: updated.amount.toString(),
    },
    ipAddress,
  });

  const { syncBudgetExceededNotification } =
    await import("@/features/notifications/services/budget-sync");
  await syncBudgetExceededNotification(userId, existing.tripId);

  return {
    expense: toExpenseDto(updated),
    warnings: collectDateWarnings(
      updated.expenseDate,
      trip.departureDate,
      trip.returnDate,
    ),
  };
}

export async function deleteExpense(
  userId: string,
  expenseId: string,
  ipAddress?: string | null,
): Promise<void> {
  const existing = await getOwnedExpenseOrThrow(userId, expenseId);

  await prisma.expense.update({
    where: { id: expenseId },
    data: {
      deletedAt: new Date(),
      // Libère le unique source_fuel_log_id pour ré-import éventuel.
      sourceFuelLogId: null,
    },
  });

  await writeAuditLog({
    userId,
    entity: "expenses",
    entityId: expenseId,
    action: "delete",
    oldValue: {
      tripId: existing.tripId,
      category: existing.category,
      amount: existing.amount.toString(),
      sourceFuelLogId: existing.sourceFuelLogId,
    },
    ipAddress,
  });

  const { syncBudgetExceededNotification } =
    await import("@/features/notifications/services/budget-sync");
  await syncBudgetExceededNotification(userId, existing.tripId);
}

export async function addExpenseReceipt(
  userId: string,
  expenseId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<ExpenseReceiptDto> {
  await getOwnedExpenseOrThrow(userId, expenseId);
  const input = parseZod(
    () => expenseReceiptSchema.parse(raw),
    "Reçu invalide",
  );

  const receipt = await prisma.expenseReceipt.create({
    data: {
      expenseId,
      fileUrl: input.fileUrl,
      ocrJson: Prisma.JsonNull,
    },
  });

  await writeAuditLog({
    userId,
    entity: "expense_receipts",
    entityId: receipt.id,
    action: "create",
    newValue: { expenseId, fileUrl: receipt.fileUrl },
    ipAddress,
  });

  return toReceiptDto(receipt);
}

/**
 * Importe un plein (fuel_log) comme dépense fuel du voyage.
 * Pré-remplit montant / date / note véhicule ; lien unique source_fuel_log_id.
 */
export async function importExpenseFromFuelLog(
  userId: string,
  raw: unknown,
  ipAddress?: string | null,
): Promise<ExpenseWriteResult> {
  const input = parseZod(
    () => importFuelExpenseSchema.parse(raw),
    "Import carburant invalide",
  );

  const trip = await getOwnedTripOrThrow(userId, input.tripId);

  const already = await prisma.expense.findFirst({
    where: {
      sourceFuelLogId: input.fuelLogId,
      deletedAt: null,
    },
  });
  if (already) {
    throw new AppError(
      "FIN_002",
      "Ce plein a déjà été ajouté aux dépenses",
      409,
    );
  }

  const fuelLog = await prisma.fuelLog.findFirst({
    where: {
      id: input.fuelLogId,
      deletedAt: null,
      vehicleId: trip.vehicleId,
      vehicle: { userId, deletedAt: null },
    },
    include: {
      vehicle: {
        select: {
          nickname: true,
          manualModelName: true,
          model: { select: { modelName: true } },
        },
      },
    },
  });
  if (!fuelLog) {
    throw new AppError("FUEL_001", "Plein introuvable", 404);
  }

  const vehicleLabel =
    fuelLog.vehicle.nickname?.trim() ||
    fuelLog.vehicle.model?.modelName ||
    fuelLog.vehicle.manualModelName ||
    "Véhicule";
  const station = fuelLog.stationName ? ` — ${fuelLog.stationName}` : "";
  const notes = `Import plein · ${vehicleLabel}${station}`;

  try {
    const created = await prisma.expense.create({
      data: {
        tripId: trip.id,
        category: "fuel",
        amount: toMoney(fuelLog.totalCost),
        currency: DEFAULT_CURRENCY,
        expenseDate: fuelLog.filledAt,
        merchant: fuelLog.stationName,
        notes,
        sourceFuelLogId: fuelLog.id,
      },
      include: expenseInclude,
    });

    await writeAuditLog({
      userId,
      entity: "expenses",
      entityId: created.id,
      action: "create",
      newValue: {
        tripId: created.tripId,
        category: created.category,
        amount: created.amount.toString(),
        sourceFuelLogId: created.sourceFuelLogId,
        importedFrom: "fuel_log",
      },
      ipAddress,
    });

    const { syncBudgetExceededNotification } =
      await import("@/features/notifications/services/budget-sync");
    await syncBudgetExceededNotification(userId, trip.id);

    return {
      expense: toExpenseDto(created),
      warnings: collectDateWarnings(
        created.expenseDate,
        trip.departureDate,
        trip.returnDate,
      ),
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(
        "FIN_002",
        "Ce plein a déjà été ajouté aux dépenses",
        409,
      );
    }
    throw error;
  }
}

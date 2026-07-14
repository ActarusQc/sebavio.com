import { beforeEach, describe, expect, it, vi } from "vitest";

const otherUserId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const expenseId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

const findFirstExpense = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    expense: {
      findFirst: (...args: unknown[]) => findFirstExpense(...args),
    },
  },
}));

vi.mock("@/features/auth/services/audit", () => ({
  writeAuditLog: vi.fn(),
}));

describe("finance isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getOwnedExpenseOrThrow → FIN_002 404 si autre propriétaire", async () => {
    findFirstExpense.mockResolvedValue(null);
    const { getOwnedExpenseOrThrow } =
      await import("@/features/finance/services/expenses");

    await expect(
      getOwnedExpenseOrThrow(otherUserId, expenseId),
    ).rejects.toMatchObject({
      code: "FIN_002",
      status: 404,
    });
    expect(findFirstExpense).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: expenseId,
          deletedAt: null,
          trip: { userId: otherUserId, deletedAt: null },
        }),
      }),
    );
  });
});

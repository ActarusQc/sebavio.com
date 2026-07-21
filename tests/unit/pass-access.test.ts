import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  planPurchaseFindUnique,
  planAccessGrantFindFirst,
  planAccessGrantFindUnique,
  planAccessGrantUpdate,
  prismaTransaction,
  writeAdminAuditLog,
} = vi.hoisted(() => ({
  planPurchaseFindUnique: vi.fn(),
  planAccessGrantFindFirst: vi.fn(),
  planAccessGrantFindUnique: vi.fn(),
  planAccessGrantUpdate: vi.fn(),
  prismaTransaction: vi.fn(),
  writeAdminAuditLog: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    planPurchase: {
      findUnique: planPurchaseFindUnique,
    },
    planAccessGrant: {
      findFirst: planAccessGrantFindFirst,
      findUnique: planAccessGrantFindUnique,
      update: planAccessGrantUpdate,
    },
    $transaction: prismaTransaction,
  },
}));

vi.mock("@/features/admin/services/audit-write", () => ({
  writeAdminAuditLog,
}));

import {
  addDaysUtc,
  adminExtendPass,
  activateOrExtendPassFromPurchase,
  computeExtendedEndsAt,
  computePassWindow,
} from "@/features/subscriptions/services/pass-access";

describe("pass-access — fenêtres UTC", () => {
  it("addDaysUtc ajoute exactement N jours civils UTC", () => {
    const start = new Date("2026-01-15T12:30:00.000Z");
    expect(addDaysUtc(start, 30).toISOString()).toBe(
      "2026-02-14T12:30:00.000Z",
    );
  });

  it("computePassWindow produit exactement +30 jours UTC", () => {
    const confirmedAt = new Date("2026-03-01T00:00:00.000Z");
    const window = computePassWindow(confirmedAt, 30);
    expect(window.startsAt.toISOString()).toBe("2026-03-01T00:00:00.000Z");
    expect(window.endsAt.toISOString()).toBe("2026-03-31T00:00:00.000Z");
  });

  it("computeExtendedEndsAt préserve le reliquat si encore valide", () => {
    const endsAt = new Date("2026-04-10T00:00:00.000Z");
    const now = new Date("2026-04-01T00:00:00.000Z");
    expect(computeExtendedEndsAt(endsAt, now, 30).toISOString()).toBe(
      "2026-05-10T00:00:00.000Z",
    );
  });

  it("computeExtendedEndsAt repart de now si déjà expiré", () => {
    const endsAt = new Date("2026-03-01T00:00:00.000Z");
    const now = new Date("2026-04-01T12:00:00.000Z");
    expect(computeExtendedEndsAt(endsAt, now, 30).toISOString()).toBe(
      "2026-05-01T12:00:00.000Z",
    );
  });

  it("empile deux prolongations sans perdre les jours", () => {
    const first = new Date("2026-06-01T00:00:00.000Z");
    const afterFirst = computeExtendedEndsAt(
      first,
      new Date("2026-05-20T00:00:00.000Z"),
      30,
    );
    const afterSecond = computeExtendedEndsAt(
      afterFirst,
      new Date("2026-06-15T00:00:00.000Z"),
      30,
    );
    expect(afterFirst.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(afterSecond.toISOString()).toBe("2026-07-31T00:00:00.000Z");
  });
});

describe("pass-access — activation idempotente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    writeAdminAuditLog.mockResolvedValue(undefined);
  });

  it("renvoie le grant lié sans double activation (même événement)", async () => {
    const purchaseId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const userId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const planId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    const grantId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
    const eventId = "evt_idempotent_1";

    planPurchaseFindUnique.mockResolvedValue({
      id: purchaseId,
      userId,
      planId,
      stripeMode: "test",
      status: "paid",
      activationStripeEventId: eventId,
      paidAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    planAccessGrantFindFirst.mockResolvedValue({
      id: grantId,
      userId,
      planId,
      status: "active",
    });

    const result = await activateOrExtendPassFromPurchase({
      purchaseId,
      stripeEventId: eventId,
      paidAt: new Date("2026-01-01T00:00:00.000Z"),
      userId,
      planId,
      durationDays: 30,
      stripeMode: "test",
    });

    expect(result).toEqual({ grantId, extended: false });
    expect(prismaTransaction).not.toHaveBeenCalled();
  });
});

describe("pass-access — prolongation admin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    writeAdminAuditLog.mockResolvedValue(undefined);
  });

  it("empile les jours admin sur endsAt actif", async () => {
    const grantId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
    const endsAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    planAccessGrantFindUnique.mockResolvedValue({
      id: grantId,
      status: "active",
      endsAt,
      startsAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    planAccessGrantUpdate.mockImplementation(
      async ({ data }: { data: { endsAt: Date; status: string } }) => ({
        id: grantId,
        status: data.status,
        endsAt: data.endsAt,
      }),
    );

    const updated = await adminExtendPass(grantId, 10, "Geste commercial", {
      userId: "admin-1",
      role: "admin",
    });

    expect(updated.status).toBe("active");
    expect(updated.endsAt.getTime()).toBeGreaterThan(endsAt.getTime());
    expect(writeAdminAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "PASS_ADMIN_EXTENDED" }),
    );
  });
});

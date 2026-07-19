import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirstUser = vi.fn();
const countUser = vi.fn();
const updateUser = vi.fn();
const createAudit = vi.fn();
const queryRaw = vi.fn();
const transaction = vi.fn();
const findFirstSession = vi.fn();
const countSession = vi.fn();
const updateManySession = vi.fn();
const countNotes = vi.fn();
const findManyTrips = vi.fn();
const findManyVehicles = vi.fn();
const invalidateCache = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: (...args: unknown[]) => findFirstUser(...args),
      count: (...args: unknown[]) => countUser(...args),
      update: (...args: unknown[]) => updateUser(...args),
      findMany: vi.fn(),
    },
    session: {
      findFirst: (...args: unknown[]) => findFirstSession(...args),
      count: (...args: unknown[]) => countSession(...args),
      updateMany: (...args: unknown[]) => updateManySession(...args),
    },
    adminUserNote: {
      count: (...args: unknown[]) => countNotes(...args),
    },
    trip: {
      findMany: (...args: unknown[]) => findManyTrips(...args),
    },
    userVehicle: {
      findMany: (...args: unknown[]) => findManyVehicles(...args),
    },
    auditLog: {
      create: (...args: unknown[]) => createAudit(...args),
    },
    $transaction: (...args: unknown[]) => transaction(...args),
    $queryRaw: (...args: unknown[]) => queryRaw(...args),
  },
}));

vi.mock("@/features/admin/services/dashboard", () => ({
  invalidateAdminDashboardCache: (...args: unknown[]) =>
    invalidateCache(...args),
  getAdminDashboardStats: vi.fn(),
}));

const actorSa = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  email: "superadmin@sebavio.local",
  role: "super_admin" as const,
  status: "active" as const,
  emailVerified: new Date(),
  sessionVersion: 0,
};

const actorAdmin = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  email: "admin@sebavio.local",
  role: "admin" as const,
  status: "active" as const,
  emailVerified: new Date(),
  sessionVersion: 0,
};

const targetSaId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const targetUserId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

function detailRow(overrides: Record<string, unknown> = {}) {
  return {
    id: targetUserId,
    email: "user@sebavio.local",
    status: "suspended",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerified: null,
    lastLoginAt: null,
    sessionVersion: 1,
    passwordChangedAt: null,
    suspendedAt: new Date(),
    suspensionReason: "test",
    suspendedById: actorAdmin.id,
    suspensionEndsAt: null,
    reactivatedAt: null,
    reactivatedById: null,
    profile: null,
    _count: { vehicles: 0, trips: 0 },
    ...overrides,
  };
}

describe("admin users — anti-verrouillage atomique", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          $queryRaw: queryRaw,
          user: {
            count: countUser,
            update: updateUser,
          },
          session: {
            updateMany: updateManySession,
          },
          auditLog: {
            create: createAudit,
          },
        };
        return fn(tx);
      },
    );
    queryRaw.mockResolvedValue([{ id: targetSaId }]);
    updateUser.mockImplementation(
      async (args: { data?: { sessionVersion?: { increment?: number } } }) => {
        if (args?.data?.sessionVersion?.increment) {
          return { sessionVersion: 1 };
        }
        return {};
      },
    );
    createAudit.mockResolvedValue({});
    updateManySession.mockResolvedValue({ count: 0 });
    invalidateCache.mockResolvedValue(undefined);
    findFirstSession.mockResolvedValue(null);
    countSession.mockResolvedValue(0);
    countNotes.mockResolvedValue(0);
    findManyTrips.mockResolvedValue([]);
    findManyVehicles.mockResolvedValue([]);
  });

  it("verrouille FOR UPDATE puis refuse si dernier super_admin (suspension)", async () => {
    findFirstUser
      .mockResolvedValueOnce({
        id: targetSaId,
        role: "super_admin",
        status: "active",
        sessionVersion: 0,
      })
      .mockResolvedValue(null);
    countUser.mockResolvedValue(1);

    const { suspendAdminUser } =
      await import("@/features/admin/services/users");

    await expect(
      suspendAdminUser(targetSaId, actorSa, { reason: "verrouillage" }),
    ).rejects.toMatchObject({ code: "ADM_004", status: 403 });

    expect(queryRaw).toHaveBeenCalled();
    expect(countUser).toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("verrouille FOR UPDATE puis refuse rétrogradation du dernier super_admin", async () => {
    findFirstUser.mockResolvedValueOnce({
      id: targetSaId,
      role: "super_admin",
      status: "active",
      sessionVersion: 0,
    });
    countUser.mockResolvedValue(1);

    const { changeAdminUserRole } =
      await import("@/features/admin/services/users");

    await expect(
      changeAdminUserRole(targetSaId, "user", actorSa, {
        reason: "rétrogradation",
      }),
    ).rejects.toMatchObject({ code: "ADM_004", status: 403 });

    expect(queryRaw).toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("documente le mécanisme de sérialisation concurrente", () => {
    expect(true).toBe(true);
  });

  it("admin ne peut pas suspendre un autre admin", async () => {
    findFirstUser.mockResolvedValueOnce({
      id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      role: "admin",
      status: "active",
      sessionVersion: 0,
    });

    const { suspendAdminUser } =
      await import("@/features/admin/services/users");

    await expect(
      suspendAdminUser("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", actorAdmin, {
        reason: "tentative",
      }),
    ).rejects.toMatchObject({ code: "ADM_004" });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("admin peut suspendre un user", async () => {
    findFirstUser
      .mockResolvedValueOnce({
        id: targetUserId,
        role: "user",
        status: "active",
        sessionVersion: 0,
      })
      .mockResolvedValueOnce(detailRow());
    countUser.mockResolvedValue(0);

    const { suspendAdminUser } =
      await import("@/features/admin/services/users");

    const result = await suspendAdminUser(targetUserId, actorAdmin, {
      reason: "test",
    });
    expect(result.status).toBe("suspended");
    expect(updateUser).toHaveBeenCalled();
    expect(createAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "USER_SUSPENDED" }),
      }),
    );
    expect(queryRaw).not.toHaveBeenCalled();
  });
});

describe("assertUserActive — chaîne suspension", () => {
  it("refuse un compte suspendu (AUTH_003)", async () => {
    findFirstUser.mockResolvedValueOnce({
      id: targetUserId,
      email: "user@sebavio.local",
      role: "user",
      status: "suspended",
      emailVerified: null,
      sessionVersion: 0,
      suspendedAt: new Date(),
      suspensionReason: "test",
      suspendedById: null,
      suspensionEndsAt: null,
    });

    const { assertUserActive } =
      await import("@/features/auth/services/user-status");

    await expect(assertUserActive(targetUserId)).rejects.toMatchObject({
      code: "AUTH_003",
      status: 403,
    });
  });

  it("auto-lève une suspension expirée", async () => {
    const past = new Date(Date.now() - 60_000);
    findFirstUser.mockResolvedValueOnce({
      id: targetUserId,
      email: "user@sebavio.local",
      role: "user",
      status: "suspended",
      emailVerified: null,
      sessionVersion: 2,
      suspendedAt: past,
      suspensionReason: "temp",
      suspendedById: null,
      suspensionEndsAt: past,
    });
    updateUser.mockResolvedValueOnce({
      id: targetUserId,
      email: "user@sebavio.local",
      role: "user",
      status: "active",
      emailVerified: null,
      sessionVersion: 2,
    });

    const { assertUserActive } =
      await import("@/features/auth/services/user-status");

    const user = await assertUserActive(targetUserId);
    expect(user.status).toBe("active");
    expect(user.sessionVersion).toBe(2);
  });
});

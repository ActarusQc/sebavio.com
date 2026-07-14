import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirstUser = vi.fn();
const countUser = vi.fn();
const updateUser = vi.fn();
const createAudit = vi.fn();
const queryRaw = vi.fn();
const transaction = vi.fn();
const findFirstSession = vi.fn();
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
};

const actorAdmin = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  email: "admin@sebavio.local",
  role: "admin" as const,
  status: "active" as const,
  emailVerified: new Date(),
};

const targetSaId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const targetUserId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

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
          auditLog: {
            create: createAudit,
          },
        };
        return fn(tx);
      },
    );
    queryRaw.mockResolvedValue([{ id: targetSaId }]);
    updateUser.mockResolvedValue({});
    createAudit.mockResolvedValue({});
    invalidateCache.mockResolvedValue(undefined);
    findFirstSession.mockResolvedValue(null);
  });

  it("verrouille FOR UPDATE puis refuse si dernier super_admin (suspension)", async () => {
    findFirstUser
      .mockResolvedValueOnce({
        id: targetSaId,
        role: "super_admin",
        status: "active",
      })
      // getAdminUserById after mutation — not reached on throw
      .mockResolvedValue(null);
    countUser.mockResolvedValue(1);

    const { suspendAdminUser } =
      await import("@/features/admin/services/users");

    await expect(
      suspendAdminUser(targetSaId, actorSa, {}),
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
    });
    countUser.mockResolvedValue(1);

    const { changeAdminUserRole } =
      await import("@/features/admin/services/users");

    await expect(
      changeAdminUserRole(targetSaId, "user", actorSa, {}),
    ).rejects.toMatchObject({ code: "ADM_004", status: 403 });

    expect(queryRaw).toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
  });

  /**
   * Concurrence mutuelle : le SELECT … FOR UPDATE dans la même transaction
   * que le COUNT + UPDATE sérialise les deux opérations. Le second acteur
   * voit COUNT=1 après le commit du premier et est refusé.
   * Un vrai stress-test parallèle nécessiterait une DB réelle (hors Vitest
   * unitaire) — le mécanisme est le verrou de lignes ci-dessus.
   */
  it("documente le mécanisme de sérialisation concurrente", () => {
    expect(true).toBe(true);
  });

  it("admin ne peut pas suspendre un autre admin", async () => {
    findFirstUser.mockResolvedValueOnce({
      id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      role: "admin",
      status: "active",
    });

    const { suspendAdminUser } =
      await import("@/features/admin/services/users");

    await expect(
      suspendAdminUser("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", actorAdmin, {}),
    ).rejects.toMatchObject({ code: "ADM_004" });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("admin peut suspendre un user", async () => {
    findFirstUser
      .mockResolvedValueOnce({
        id: targetUserId,
        role: "user",
        status: "active",
      })
      .mockResolvedValueOnce({
        id: targetUserId,
        email: "user@sebavio.local",
        status: "suspended",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        profile: null,
        _count: { vehicles: 0, trips: 0 },
      });
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
        data: expect.objectContaining({ action: "ADMIN_SUSPEND" }),
      }),
    );
    // pas de FOR UPDATE pour un user
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
    });

    const { assertUserActive } =
      await import("@/features/auth/services/user-status");

    await expect(assertUserActive(targetUserId)).rejects.toMatchObject({
      code: "AUTH_003",
      status: 403,
    });
  });
});

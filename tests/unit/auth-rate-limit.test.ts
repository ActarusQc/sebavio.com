import { beforeEach, describe, expect, it, vi } from "vitest";

const connect = vi.fn();
const incr = vi.fn();
const expire = vi.fn();

vi.mock("@/lib/redis", () => ({
  getRedis: () => ({
    status: "ready",
    connect,
    incr,
    expire,
    del: vi.fn(),
  }),
}));

describe("assertLoginRateLimit", () => {
  beforeEach(() => {
    vi.resetModules();
    connect.mockReset();
    incr.mockReset();
    expire.mockReset();
  });

  it("refuse si le quota est dépassé", async () => {
    incr.mockResolvedValue(6);
    const { assertLoginRateLimit } =
      await import("@/features/auth/services/rate-limit");
    await expect(
      assertLoginRateLimit("1.1.1.1", "a@b.co"),
    ).rejects.toMatchObject({
      code: "AUTH_RATE_LIMIT",
    });
  });

  it("échec fermé si Redis est indisponible", async () => {
    incr.mockRejectedValue(new Error("ECONNREFUSED"));
    const { assertLoginRateLimit } =
      await import("@/features/auth/services/rate-limit");
    await expect(
      assertLoginRateLimit("1.1.1.1", "a@b.co"),
    ).rejects.toMatchObject({
      code: "AUTH_UNAVAILABLE",
    });
  });

  it("autorise sous le plafond", async () => {
    incr.mockResolvedValue(1);
    expire.mockResolvedValue(1);
    const { assertLoginRateLimit } =
      await import("@/features/auth/services/rate-limit");
    await expect(
      assertLoginRateLimit("1.1.1.1", "a@b.co"),
    ).resolves.toBeUndefined();
    expect(expire).toHaveBeenCalled();
  });
});

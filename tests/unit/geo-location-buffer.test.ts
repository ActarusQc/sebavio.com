import { describe, expect, it } from "vitest";
import { applyFifoBuffer } from "@/features/trips/lib/geo-location-buffer";
import { GEO_OFFLINE_BUFFER_MAX } from "@/features/trips/lib/geolocation";

function mk(i: number, tripId = "t1") {
  return {
    clientPointId: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    tripId,
    latitude: 45 + i * 0.001,
    longitude: -73,
    accuracyM: 10 as number | null,
    heading: null as number | null,
    speedMps: null as number | null,
    recordedAt: new Date(1_000_000 + i * 1000).toISOString(),
  };
}

describe("applyFifoBuffer", () => {
  it("conserve au maximum 20 points (FIFO)", () => {
    let rows: ReturnType<typeof mk>[] = [];
    for (let i = 0; i < GEO_OFFLINE_BUFFER_MAX + 5; i += 1) {
      rows = applyFifoBuffer(rows, mk(i));
    }
    expect(rows).toHaveLength(GEO_OFFLINE_BUFFER_MAX);
    expect(rows[0]?.latitude).toBeCloseTo(45 + 5 * 0.001, 5);
    expect(rows.at(-1)?.latitude).toBeCloseTo(
      45 + (GEO_OFFLINE_BUFFER_MAX + 4) * 0.001,
      5,
    );
  });

  it("remplace un point au même clientPointId", () => {
    const a = mk(1);
    const b = { ...mk(1), latitude: 46 };
    const rows = applyFifoBuffer([a], b);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.latitude).toBe(46);
  });

  it("suppression = liste vide après clear logique", () => {
    const rows = applyFifoBuffer([mk(1), mk(2)], mk(3));
    expect(rows.filter((r) => r.tripId === "other")).toHaveLength(0);
    expect(rows).toHaveLength(3);
  });
});

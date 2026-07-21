import { describe, expect, it } from "vitest";
import {
  getEffectiveCoordinates,
  haversineDistanceM,
  mapGeolocationError,
  pauseStorageKey,
  shouldKeepSample,
} from "@/features/trips/lib/geolocation";

describe("haversineDistanceM", () => {
  it("calcule ~0 pour le même point", () => {
    expect(
      haversineDistanceM(
        { latitude: 45.5, longitude: -73.5 },
        { latitude: 45.5, longitude: -73.5 },
      ),
    ).toBeLessThan(0.01);
  });

  it("calcule environ 111 km pour 1° de latitude", () => {
    const d = haversineDistanceM(
      { latitude: 45, longitude: -73 },
      { latitude: 46, longitude: -73 },
    );
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_000);
  });
});

describe("shouldKeepSample", () => {
  const base = {
    latitude: 45.5,
    longitude: -73.5,
    recordedAtMs: 1_000_000,
    accuracyM: 20,
  };

  it("accepte le premier point", () => {
    expect(shouldKeepSample(base, null)).toBe(true);
  });

  it("déclenche à ≥ 50 m", () => {
    // ~55 m vers le nord
    const next = {
      ...base,
      latitude: 45.5005,
      recordedAtMs: base.recordedAtMs + 5_000,
    };
    expect(haversineDistanceM(base, next)).toBeGreaterThan(50);
    expect(shouldKeepSample(next, base)).toBe(true);
  });

  it("déclenche à ≥ 45 s même sans déplacement", () => {
    const next = {
      ...base,
      recordedAtMs: base.recordedAtMs + 45_000,
    };
    expect(shouldKeepSample(next, base)).toBe(true);
  });

  it("n’accepte pas avant les seuils", () => {
    const next = {
      ...base,
      latitude: 45.50005, // ~5 m
      recordedAtMs: base.recordedAtMs + 10_000,
    };
    expect(haversineDistanceM(base, next)).toBeLessThan(50);
    expect(shouldKeepSample(next, base)).toBe(false);
  });

  it("refuse un timestamp invalide", () => {
    expect(shouldKeepSample({ ...base, recordedAtMs: Number.NaN }, null)).toBe(
      false,
    );
  });

  it("refuse un timestamp plus ancien que le dernier", () => {
    const next = { ...base, recordedAtMs: base.recordedAtMs - 5_000 };
    expect(shouldKeepSample(next, base)).toBe(false);
  });

  it("refuse une précision extrême", () => {
    expect(shouldKeepSample({ ...base, accuracyM: 10_000 }, null)).toBe(false);
  });

  it("refuse des coordonnées non finies", () => {
    expect(
      shouldKeepSample({ ...base, latitude: Number.POSITIVE_INFINITY }, null),
    ).toBe(false);
  });
});

describe("getEffectiveCoordinates", () => {
  const now = 1_000_000_000;
  const origin = { latitude: 45.5, longitude: -73.6 };

  it("priorise le live frais et précis", () => {
    const r = getEffectiveCoordinates({
      livePosition: {
        latitude: 46,
        longitude: -74,
        accuracyM: 30,
        recordedAtMs: now - 30_000,
      },
      latestServerPosition: {
        latitude: 47,
        longitude: -75,
        accuracyM: 20,
        recordedAtMs: now - 10_000,
      },
      tripOrigin: origin,
      now,
    });
    expect(r.source).toBe("live");
    expect(r.latitude).toBe(46);
  });

  it("ignore le live trop imprécis (≥ 500 m) et prend le serveur", () => {
    const r = getEffectiveCoordinates({
      livePosition: {
        latitude: 46,
        longitude: -74,
        accuracyM: 600,
        recordedAtMs: now - 10_000,
      },
      latestServerPosition: {
        latitude: 47,
        longitude: -75,
        accuracyM: 40,
        recordedAtMs: now - 20_000,
      },
      tripOrigin: origin,
      now,
    });
    expect(r.source).toBe("server");
    expect(r.latitude).toBe(47);
  });

  it("retombe sur l’origine du voyage", () => {
    const r = getEffectiveCoordinates({
      livePosition: null,
      latestServerPosition: null,
      tripOrigin: origin,
      now,
    });
    expect(r.source).toBe("trip_origin");
    expect(r.latitude).toBe(45.5);
  });

  it("retourne none sans aucune source", () => {
    const r = getEffectiveCoordinates({ now });
    expect(r.source).toBe("none");
    expect(r.latitude).toBeNull();
  });

  it("ignore un live trop vieux (> 2 min)", () => {
    const r = getEffectiveCoordinates({
      livePosition: {
        latitude: 46,
        longitude: -74,
        accuracyM: 20,
        recordedAtMs: now - 3 * 60_000,
      },
      tripOrigin: origin,
      now,
    });
    expect(r.source).toBe("trip_origin");
  });
});

describe("mapGeolocationError", () => {
  it("mappe PERMISSION_DENIED", () => {
    const r = mapGeolocationError(1);
    expect(r.code).toBe("PERMISSION_DENIED");
    expect(r.messageFr).toMatch(/refus/i);
  });

  it("mappe unsupported", () => {
    expect(mapGeolocationError("unsupported").code).toBe("unsupported");
  });
});

describe("pauseStorageKey", () => {
  it("préfixe le tripId", () => {
    expect(pauseStorageKey("abc")).toBe("trip-geo-paused:abc");
  });
});

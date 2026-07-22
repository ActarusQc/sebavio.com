import { describe, expect, it } from "vitest";
import {
  resolveRelativeDates,
  sanitizePlanningDateAgainstToday,
  getZonedCalendarDay,
} from "@/features/ai-trip-planner/lib/resolve-relative-dates";
import { hasItineraryProposal } from "@/features/ai-trip-planner/lib/planning-step";
import { buildInterestBasedItinerary } from "@/features/ai-trip-planner/lib/interest-itinerary";
import { tripDraftSchema } from "@/features/ai-trip-planner/schemas/draft";

describe("resolveRelativeDates", () => {
  const now = new Date("2026-07-21T15:00:00.000Z"); // mardi 21 juillet 2026 (Toronto)
  const tz = "America/Toronto";

  it("résout « ce week-end » vers samedi–dimanche 2026", () => {
    const r = resolveRelativeDates({
      text: "Ce week-end",
      timeZone: tz,
      now,
    });
    expect(r.kind).toBe("resolved");
    if (r.kind === "resolved") {
      expect(r.departureDate).toBe("2026-07-25");
      expect(r.returnDate).toBe("2026-07-26");
      expect(r.confirmationLabel).toMatch(/2026/);
      expect(r.confirmationLabel).not.toMatch(/2025/);
    }
  });

  it("demande samedi ou dimanche pour une journée + ce week-end", () => {
    const r = resolveRelativeDates({
      text: "Ce week-end",
      timeZone: tz,
      now,
      knownDurationDays: 1,
    });
    expect(r.kind).toBe("clarify_weekend_day");
    if (r.kind === "clarify_weekend_day") {
      expect(r.options).toHaveLength(2);
      expect(r.options[0]?.departureDate).toBe("2026-07-25");
      expect(r.options[1]?.departureDate).toBe("2026-07-26");
    }
  });

  it("résout directement samedi si déjà précisé", () => {
    const r = resolveRelativeDates({
      text: "Samedi",
      timeZone: tz,
      now,
      knownDurationDays: 1,
    });
    expect(r.kind).toBe("resolved");
    if (r.kind === "resolved") {
      expect(r.departureDate).toBe("2026-07-25");
      expect(r.returnDate).toBe("2026-07-25");
    }
  });

  it("traite « 3 jours » comme durée sans inventer de date", () => {
    const r = resolveRelativeDates({
      text: "3 jours",
      timeZone: tz,
      now,
    });
    expect(r.kind).toBe("need_start_date");
    if (r.kind === "need_start_date") {
      expect(r.durationDays).toBe(3);
    }
  });

  it("corrige une année IA passée", () => {
    const fixed = sanitizePlanningDateAgainstToday("2025-07-25", tz, now);
    expect(fixed).toBe("2026-07-25");
  });

  it("lit le calendrier dans le fuseau Toronto", () => {
    const day = getZonedCalendarDay(now, tz);
    expect(day.year).toBe(2026);
    expect(day.month).toBe(7);
    expect(day.day).toBe(21);
  });
});

describe("proposition gastronomique", () => {
  it("refuse les placeholders génériques comme proposition confirmable", () => {
    const draft = tripDraftSchema.parse({
      origin: { name: "Bromont", city: "Bromont" },
      destination: { name: "Estrie", city: "Estrie" },
      departureDate: "2026-07-25",
      returnDate: "2026-07-26",
      adults: 2,
      vehicleId: "11111111-1111-4111-8111-111111111111",
      estimatedDistanceKm: 80,
      activities: [
        {
          name: "Arrivée et balade à Estrie",
          category: "activity",
          justification: "x",
        },
        {
          name: "Point d’intérêt près de Estrie",
          category: "activity",
          justification: "x",
        },
      ],
    });
    expect(hasItineraryProposal(draft)).toBe(false);
  });

  it("génère des arrêts gourmands concrets pour l’Estrie", () => {
    const draft = tripDraftSchema.parse({
      origin: { name: "Bromont", city: "Bromont" },
      destination: { name: "Estrie", city: "Magog" },
      departureDate: "2026-07-25",
      durationDays: 1,
      adults: 2,
      vehicleId: "11111111-1111-4111-8111-111111111111",
      estimatedDistanceKm: 40,
      estimatedDurationMinutes: 45,
      preferences: ["gastronomie"],
    });
    const built = buildInterestBasedItinerary(draft);
    expect(hasItineraryProposal(built)).toBe(true);
    const names = built.activities.map((a) => a.name).join(" ");
    expect(names).toMatch(/Marché|Vignoble|Fromagerie|Microbrasserie/i);
    expect(names).not.toMatch(/Arrivée et balade|Point d’intérêt près/i);
  });
});

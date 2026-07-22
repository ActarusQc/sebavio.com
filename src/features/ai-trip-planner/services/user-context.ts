import "server-only";

import { prisma } from "@/lib/prisma";
import { getHomeAddress } from "@/features/users/services/home-address";
import { DEFAULT_QUEBEC_ORIGIN_SUGGESTIONS } from "@/features/ai-trip-planner/constants";
import { DEFAULT_TIMEZONE } from "@/features/users/services/defaults";
import type { OriginSuggestionDto } from "@/features/ai-trip-planner/types";
import type { HomeAddressDto } from "@/features/users/types";

export async function loadPlannerUserContext(userId: string): Promise<{
  home: HomeAddressDto | null;
  homeCity: string | null;
  timezone: string;
  recentOriginCities: string[];
  originSuggestions: OriginSuggestionDto[];
}> {
  const [home, profile] = await Promise.all([
    getHomeAddress(userId),
    prisma.userProfile.findUnique({
      where: { userId },
      select: { timezone: true },
    }),
  ]);
  const homeCity = home?.city?.trim() || null;
  const timezone = profile?.timezone?.trim() || DEFAULT_TIMEZONE;

  const recentTrips = await prisma.trip.findMany({
    where: { userId, deletedAt: null },
    select: {
      origin: true,
      originCity: true,
      originPlaceId: true,
    },
    orderBy: [{ departureDate: "desc" }, { createdAt: "desc" }],
    take: 8,
  });

  const recentOriginCities: string[] = [];
  const seen = new Set<string>();
  for (const t of recentTrips) {
    const city = (t.originCity ?? t.origin.split(",")[0] ?? "").trim();
    if (!city) continue;
    const key = city.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    recentOriginCities.push(city);
    if (recentOriginCities.length >= 3) break;
  }

  const originSuggestions: OriginSuggestionDto[] = [];
  if (homeCity) {
    originSuggestions.push({
      kind: "home",
      label: `Domicile — ${homeCity}`,
      city: homeCity,
    });
  }
  for (const city of recentOriginCities) {
    if (homeCity && city.toLowerCase() === homeCity.toLowerCase()) continue;
    originSuggestions.push({ kind: "recent", label: city, city });
  }
  for (const city of DEFAULT_QUEBEC_ORIGIN_SUGGESTIONS) {
    if (originSuggestions.length >= 7) break;
    if (
      originSuggestions.some(
        (s) => s.city?.toLowerCase() === city.toLowerCase(),
      )
    ) {
      continue;
    }
    originSuggestions.push({ kind: "city", label: city, city });
  }

  return { home, homeCity, timezone, recentOriginCities, originSuggestions };
}

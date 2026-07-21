/**
 * Interprétation des repas (français du Québec) + horaires.
 */

export type MealType = "breakfast" | "lunch" | "dinner";

export type MealTiming = {
  mealType: MealType;
  targetHour: number;
  targetMinute: number;
  targetTimeSource: "explicit_user" | "conversation" | "trip_default";
};

export type DepartureTiming = {
  hour: number;
  minute: number;
  source: "explicit_user" | "conversation" | "trip_default";
};

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

/**
 * QC : déjeuner=matin, dîner=midi, souper=soir.
 * « dîner à midi » → lunch 12:00 (jamais souper).
 */
export function resolveMealTiming(message: string): MealTiming | null {
  const msg = normalize(message);

  if (/\b(diner|dîner)\b/.test(msg) && /\bmidi\b/.test(msg)) {
    return {
      mealType: "lunch",
      targetHour: 12,
      targetMinute: 0,
      targetTimeSource: "explicit_user",
    };
  }
  if (/\bmidi\b/.test(msg)) {
    return {
      mealType: "lunch",
      targetHour: 12,
      targetMinute: 0,
      targetTimeSource: "explicit_user",
    };
  }

  const clockAfterMeal = msg.match(
    /\b(?:diner|dîner|dejeuner|déjeuner|souper|manger|repas)\b[\s\S]{0,40}?\b(?:a|à|vers)?\s*(\d{1,2})\s*[h:]\s*(\d{2})?\b/,
  );
  if (clockAfterMeal) {
    const hour = Number.parseInt(clockAfterMeal[1]!, 10);
    const minute = clockAfterMeal[2]
      ? Number.parseInt(clockAfterMeal[2], 10)
      : 0;
    if (hour >= 0 && hour <= 23) {
      const mealType: MealType =
        hour < 11 ? "breakfast" : hour < 16 ? "lunch" : "dinner";
      return {
        mealType,
        targetHour: hour,
        targetMinute: minute,
        targetTimeSource: "explicit_user",
      };
    }
  }

  if (/\b(dejeuner|déjeuner)\b/.test(msg)) {
    return {
      mealType: "breakfast",
      targetHour: 8,
      targetMinute: 0,
      targetTimeSource: "explicit_user",
    };
  }
  if (/\b(diner|dîner)\b/.test(msg)) {
    return {
      mealType: "lunch",
      targetHour: 12,
      targetMinute: 0,
      targetTimeSource: "explicit_user",
    };
  }
  if (/\bsouper\b/.test(msg)) {
    return {
      mealType: "dinner",
      targetHour: 18,
      targetMinute: 30,
      targetTimeSource: "explicit_user",
    };
  }
  return null;
}

export function resolveDepartureTiming(
  message: string,
): DepartureTiming | null {
  const msg = normalize(message);
  const m = msg.match(
    /\b(?:quitte|partir|part|compte partir|depart|départ|laisse)\b[\s\S]{0,50}?\b(?:a|à|vers)?\s*(\d{1,2})\s*[h:]\s*(\d{2})?\b/,
  );
  if (m) {
    const hour = Number.parseInt(m[1]!, 10);
    const minute = m[2] ? Number.parseInt(m[2], 10) : 0;
    if (hour >= 0 && hour <= 23) {
      return { hour, minute, source: "explicit_user" };
    }
  }
  // « à 6 h » près de partir
  const loose = msg.match(
    /\b(?:a|à)\s*(\d{1,2})\s*[h:]\s*(\d{2})?\b[\s\S]{0,20}?\b(?:partir|depart|départ)\b/,
  );
  if (loose) {
    const hour = Number.parseInt(loose[1]!, 10);
    const minute = loose[2] ? Number.parseInt(loose[2], 10) : 0;
    if (hour >= 0 && hour <= 23) {
      return { hour, minute, source: "explicit_user" };
    }
  }
  return null;
}

export function mealTypeLabelFr(mealType: MealType): string {
  switch (mealType) {
    case "breakfast":
      return "déjeuner";
    case "lunch":
      return "dîner";
    case "dinner":
      return "souper";
  }
}

/** Fuseau voyage Québec. */
export const TRIP_TIME_ZONE = "America/Toronto";

function getTzParts(
  date: Date,
  timeZone: string,
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) =>
    Number.parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

/** Construit un Instant UTC correspondant à une heure murale dans le fuseau. */
export function wallTimeInTimeZoneToUtc(input: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  timeZone?: string;
}): Date {
  const timeZone = input.timeZone ?? TRIP_TIME_ZONE;
  let utc = Date.UTC(
    input.year,
    input.month - 1,
    input.day,
    input.hour,
    input.minute,
    0,
  );
  for (let i = 0; i < 4; i++) {
    const parts = getTzParts(new Date(utc), timeZone);
    const desired = Date.UTC(
      input.year,
      input.month - 1,
      input.day,
      input.hour,
      input.minute,
    );
    const actual = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
    );
    utc += desired - actual;
  }
  return new Date(utc);
}

export function combineTripDateAndClock(
  departureDateIso: string,
  clock: { hour: number; minute: number },
  timeZone = TRIP_TIME_ZONE,
): Date {
  const base = new Date(departureDateIso);
  const parts = getTzParts(base, timeZone);
  return wallTimeInTimeZoneToUtc({
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: clock.hour,
    minute: clock.minute,
    timeZone,
  });
}

/** Affichage « 12 h 05 » — jamais d’ISO brut. */
export function formatLocalClock(
  value: string | Date | null | undefined,
  timeZone = TRIP_TIME_ZONE,
): string | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const already = value.trim();
    if (/^\d{1,2}\s*h\s*\d{0,2}$/i.test(already)) return already;
    if (!/\d{4}-\d{2}-\d{2}T/.test(already) && !/Z$/i.test(already)) {
      // texte libre non-ISO
      if (!already.includes("T")) return already;
    }
  }
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  const parts = getTzParts(date, timeZone);
  const h = parts.hour;
  const m = parts.minute;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

export function formatLocalDayLabel(
  value: string | Date | null | undefined,
  timeZone = TRIP_TIME_ZONE,
): string | null {
  if (value == null) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

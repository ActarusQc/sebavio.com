/**
 * Résolution déterministe des dates relatives (français canadien).
 * L’IA ne doit jamais inventer l’année — tout passe par ce module.
 */

export type RelativeDateResolution =
  | {
      kind: "resolved";
      departureDate: string;
      returnDate: string;
      durationDays: number;
      confirmationLabel: string;
    }
  | {
      kind: "clarify_weekend_day";
      options: Array<{
        label: string;
        departureDate: string;
        returnDate: string;
      }>;
      message: string;
    }
  | {
      kind: "duration_only";
      durationDays: number;
      message: string;
    }
  | {
      kind: "need_start_date";
      durationDays: number;
      message: string;
    }
  | { kind: "none" };

const WEEKDAY_MAP: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[’']/g, "'")
    .trim();
}

export function getZonedCalendarDay(
  now: Date,
  timeZone: string,
): { year: number; month: number; day: number; weekday: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(now);

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  const wd = (parts.find((p) => p.type === "weekday")?.value ?? "Mon")
    .slice(0, 3)
    .toLowerCase();
  const weekday = WEEKDAY_MAP[wd] ?? 1;
  return { year, month, day, weekday };
}

function ymdToIso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDays(
  year: number,
  month: number,
  day: number,
  delta: number,
): { year: number; month: number; day: number; weekday: number } {
  const utc = new Date(Date.UTC(year, month - 1, day + delta, 12));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
    weekday: utc.getUTCDay(),
  };
}

/** Prochain jour de semaine (0=dim…6=sam). Si aujourd’hui = cible → aujourd’hui. */
function nextWeekdayOnOrAfter(
  base: { year: number; month: number; day: number; weekday: number },
  targetWeekday: number,
): { year: number; month: number; day: number; weekday: number } {
  const delta = (targetWeekday - base.weekday + 7) % 7;
  return addDays(base.year, base.month, base.day, delta);
}

function nextWeekdayStrictAfter(
  base: { year: number; month: number; day: number; weekday: number },
  targetWeekday: number,
): { year: number; month: number; day: number; weekday: number } {
  const delta = (targetWeekday - base.weekday + 7) % 7 || 7;
  return addDays(base.year, base.month, base.day, delta);
}

function formatFrLong(iso: string, timeZone: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!, 12));
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatFrShort(iso: string, timeZone: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!, 12));
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const da = Date.UTC(ay!, am! - 1, ad!);
  const db = Date.UTC(by!, bm! - 1, bd!);
  return Math.round((db - da) / 86_400_000) + 1;
}

function weekendPair(
  today: { year: number; month: number; day: number; weekday: number },
  preferNext: boolean,
): { sat: ReturnType<typeof addDays>; sun: ReturnType<typeof addDays> } {
  let sat: ReturnType<typeof addDays>;
  if (preferNext) {
    sat = nextWeekdayStrictAfter(today, 6);
  } else if (today.weekday === 6) {
    sat = today;
  } else if (today.weekday === 0) {
    // Dimanche : « ce week-end » → le week-end suivant (éviter dates déjà passées)
    sat = nextWeekdayStrictAfter(today, 6);
  } else {
    sat = nextWeekdayOnOrAfter(today, 6);
  }
  const sun = addDays(sat.year, sat.month, sat.day, 1);
  return { sat, sun };
}

export type ResolveRelativeDatesInput = {
  text: string;
  timeZone?: string;
  now?: Date;
  /** Durée déjà connue (ex. « une journée seulement »). */
  knownDurationDays?: number | null;
  /** Déjà une indication « samedi » / « dimanche » dans le brouillon ou l’historique. */
  preferredWeekendDay?: "saturday" | "sunday" | null;
};

/**
 * Interprète une expression de date relative. Ne renvoie jamais d’année inventée par l’IA.
 */
export function resolveRelativeDates(
  input: ResolveRelativeDatesInput,
): RelativeDateResolution {
  const timeZone = input.timeZone?.trim() || "America/Toronto";
  const now = input.now ?? new Date();
  const today = getZonedCalendarDay(now, timeZone);
  const text = normalize(input.text);
  if (!text) return { kind: "none" };

  const knownDuration = input.knownDurationDays ?? null;

  // Durée seule
  const durationMatch =
    text.match(/^(?:pour\s+)?(\d+)\s*jours?$/) ||
    text.match(/^une journee seulement$/) ||
    text.match(/^1\s*jour(?:nee)?$/);
  if (
    durationMatch &&
    !/(week|fin de semaine|samedi|dimanche|vendredi)/.test(text)
  ) {
    const days =
      text.includes("journee") || text === "1 jour" || text === "1 journee"
        ? 1
        : Number(durationMatch[1]);
    if (Number.isFinite(days) && days >= 1 && days <= 90) {
      return {
        kind: "need_start_date",
        durationDays: days,
        message: "À partir de quelle date souhaitez-vous partir?",
      };
    }
  }

  // Sélection explicite « Samedi 25 juillet » (bouton clarifié)
  const labeledDay = text.match(
    /^(samedi|dimanche)\s+(\d{1,2})\s+(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)\b/,
  );
  if (labeledDay) {
    const targetWd = labeledDay[1] === "samedi" ? 6 : 0;
    const { sat, sun } = weekendPair(today, false);
    const pick = targetWd === 6 ? sat : sun;
    const iso = ymdToIso(pick.year, pick.month, pick.day);
    return {
      kind: "resolved",
      departureDate: iso,
      returnDate: iso,
      durationDays: 1,
      confirmationLabel: `Parfait, je prévois donc le voyage le ${formatFrLong(iso, timeZone)}.`,
    };
  }

  const wantsWeekend =
    /\b(ce week-?end|cette fin de semaine|la fin de semaine|le week-?end)\b/.test(
      text,
    ) ||
    text === "ce week-end" ||
    text === "cette fin de semaine";

  const wantsNextWeekend =
    /\b(la fin de semaine prochaine|le week-?end prochain|week-?end prochain)\b/.test(
      text,
    );

  const oneDayContext =
    knownDuration === 1 ||
    /\bune journee seulement\b/.test(text) ||
    /\b(une|1)\s*journee\b/.test(text);

  if (wantsWeekend || wantsNextWeekend) {
    const { sat, sun } = weekendPair(today, wantsNextWeekend);
    const satIso = ymdToIso(sat.year, sat.month, sat.day);
    const sunIso = ymdToIso(sun.year, sun.month, sun.day);

    if (oneDayContext || input.preferredWeekendDay) {
      if (input.preferredWeekendDay === "saturday" || /\bsamedi\b/.test(text)) {
        return {
          kind: "resolved",
          departureDate: satIso,
          returnDate: satIso,
          durationDays: 1,
          confirmationLabel: `Parfait, je prévois donc le voyage le ${formatFrLong(satIso, timeZone)}.`,
        };
      }
      if (input.preferredWeekendDay === "sunday" || /\bdimanche\b/.test(text)) {
        return {
          kind: "resolved",
          departureDate: sunIso,
          returnDate: sunIso,
          durationDays: 1,
          confirmationLabel: `Parfait, je prévois donc le voyage le ${formatFrLong(sunIso, timeZone)}.`,
        };
      }
      if (oneDayContext) {
        const satLabel = formatFrShort(satIso, timeZone);
        const sunLabel = formatFrShort(sunIso, timeZone);
        return {
          kind: "clarify_weekend_day",
          message: "Préférez-vous samedi ou dimanche?",
          options: [
            {
              label: satLabel.charAt(0).toUpperCase() + satLabel.slice(1),
              departureDate: satIso,
              returnDate: satIso,
            },
            {
              label: sunLabel.charAt(0).toUpperCase() + sunLabel.slice(1),
              departureDate: sunIso,
              returnDate: sunIso,
            },
          ],
        };
      }
    }

    let returnIso = sunIso;
    if (knownDuration && knownDuration > 2) {
      const end = addDays(sat.year, sat.month, sat.day, knownDuration - 1);
      returnIso = ymdToIso(end.year, end.month, end.day);
    }

    return {
      kind: "resolved",
      departureDate: satIso,
      returnDate: returnIso,
      durationDays: daysBetween(satIso, returnIso),
      confirmationLabel: `Parfait, je prévois donc le voyage du ${formatFrLong(satIso, timeZone)} au ${formatFrLong(returnIso, timeZone)}.`,
    };
  }

  // Aujourd’hui / demain / après-demain
  if (/^aujourd'?hui$/.test(text) || /\bpartir aujourd'?hui\b/.test(text)) {
    const iso = ymdToIso(today.year, today.month, today.day);
    const days = knownDuration && knownDuration > 1 ? knownDuration : 1;
    const end = addDays(today.year, today.month, today.day, days - 1);
    const returnIso = ymdToIso(end.year, end.month, end.day);
    return {
      kind: "resolved",
      departureDate: iso,
      returnDate: returnIso,
      durationDays: days,
      confirmationLabel: `Parfait, je prévois donc le départ ${formatFrLong(iso, timeZone)}.`,
    };
  }
  if (/^demain$/.test(text) || /\bpartir demain\b/.test(text)) {
    const d = addDays(today.year, today.month, today.day, 1);
    const iso = ymdToIso(d.year, d.month, d.day);
    const days = knownDuration && knownDuration > 1 ? knownDuration : 1;
    const end = addDays(d.year, d.month, d.day, days - 1);
    return {
      kind: "resolved",
      departureDate: iso,
      returnDate: ymdToIso(end.year, end.month, end.day),
      durationDays: days,
      confirmationLabel: `Parfait, je prévois donc le départ ${formatFrLong(iso, timeZone)}.`,
    };
  }
  if (/^apres-?demain$/.test(text)) {
    const d = addDays(today.year, today.month, today.day, 2);
    const iso = ymdToIso(d.year, d.month, d.day);
    const days = knownDuration && knownDuration > 1 ? knownDuration : 1;
    const end = addDays(d.year, d.month, d.day, days - 1);
    return {
      kind: "resolved",
      departureDate: iso,
      returnDate: ymdToIso(end.year, end.month, end.day),
      durationDays: days,
      confirmationLabel: `Parfait, je prévois donc le départ ${formatFrLong(iso, timeZone)}.`,
    };
  }

  // Jour de semaine nommé
  const dayNames: Array<[RegExp, number]> = [
    [/\b(ce|prochain)?\s*lundi\b/, 1],
    [/\b(ce|prochain)?\s*mardi\b/, 2],
    [/\b(ce|prochain)?\s*mercredi\b/, 3],
    [/\b(ce|prochain)?\s*jeudi\b/, 4],
    [/\b(ce|prochain)?\s*vendredi\b/, 5],
    [/\b(ce|prochain)?\s*samedi\b/, 6],
    [/\b(ce|prochain)?\s*dimanche\b/, 0],
  ];
  for (const [re, wd] of dayNames) {
    if (!re.test(text)) continue;
    const strict = /\bprochain\b/.test(text);
    const day = strict
      ? nextWeekdayStrictAfter(today, wd)
      : nextWeekdayOnOrAfter(today, wd);
    const iso = ymdToIso(day.year, day.month, day.day);
    // du vendredi au dimanche
    if (/\bdu vendredi au dimanche\b/.test(text)) {
      const fri = nextWeekdayOnOrAfter(today, 5);
      const friIso = ymdToIso(fri.year, fri.month, fri.day);
      const sun = addDays(fri.year, fri.month, fri.day, 2);
      const sunIso = ymdToIso(sun.year, sun.month, sun.day);
      return {
        kind: "resolved",
        departureDate: friIso,
        returnDate: sunIso,
        durationDays: 3,
        confirmationLabel: `Parfait, je prévois donc le voyage du ${formatFrLong(friIso, timeZone)} au ${formatFrLong(sunIso, timeZone)}.`,
      };
    }
    const days = knownDuration && knownDuration > 1 ? knownDuration : 1;
    const end = addDays(day.year, day.month, day.day, days - 1);
    const returnIso = ymdToIso(end.year, end.month, end.day);
    return {
      kind: "resolved",
      departureDate: iso,
      returnDate: returnIso,
      durationDays: days,
      confirmationLabel: `Parfait, je prévois donc le voyage ${days > 1 ? `du ${formatFrLong(iso, timeZone)} au ${formatFrLong(returnIso, timeZone)}` : `le ${formatFrLong(iso, timeZone)}`}.`,
    };
  }

  if (/\bdans deux semaines\b/.test(text)) {
    const d = addDays(today.year, today.month, today.day, 14);
    const iso = ymdToIso(d.year, d.month, d.day);
    const days = knownDuration && knownDuration > 1 ? knownDuration : 2;
    const end = addDays(d.year, d.month, d.day, days - 1);
    return {
      kind: "resolved",
      departureDate: iso,
      returnDate: ymdToIso(end.year, end.month, end.day),
      durationDays: days,
      confirmationLabel: `Parfait, je prévois donc le départ ${formatFrLong(iso, timeZone)}.`,
    };
  }

  // ISO explicite fourni par l’utilisateur (pas l’IA)
  const isoMatch = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (isoMatch) {
    const iso = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    const days = knownDuration && knownDuration > 1 ? knownDuration : 1;
    const [y, m, d] = iso.split("-").map(Number);
    const end = addDays(y!, m!, d!, days - 1);
    return {
      kind: "resolved",
      departureDate: iso,
      returnDate: ymdToIso(end.year, end.month, end.day),
      durationDays: days,
      confirmationLabel: `Parfait, je prévois donc le départ ${formatFrLong(iso, timeZone)}.`,
    };
  }

  return { kind: "none" };
}

/** Rejette ou corrige une date AI dans le passé / mauvaise année. */
export function sanitizePlanningDateAgainstToday(
  iso: string | null | undefined,
  timeZone: string,
  now = new Date(),
): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const today = getZonedCalendarDay(now, timeZone);
  const todayIso = ymdToIso(today.year, today.month, today.day);
  const parts = iso.split("-").map(Number) as [number, number, number];
  let y = parts[0];
  const m = parts[1];
  const d = parts[2];

  // Année passée → forcer l’année courante du fuseau
  if (y < today.year) {
    y = today.year;
  }
  let fixed = ymdToIso(y, m, d);
  // Si toujours avant aujourd’hui, basculer à l’année suivante
  if (fixed < todayIso) {
    fixed = ymdToIso(today.year + 1, m, d);
  }
  if (fixed < todayIso) return null;
  return fixed;
}

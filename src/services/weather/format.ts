/**
 * Formatage dates/heures selon le fuseau de la destination (IANA) si fourni.
 */

export function unixToIso(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString();
}

export function unixToDateOnlyInTimezone(
  unixSeconds: number,
  timeZone: string,
): string {
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return fmt.format(new Date(unixSeconds * 1000));
  } catch {
    return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
  }
}

export function formatDateTimeInTimezone(
  isoOrUnix: string | number,
  timeZone: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date =
    typeof isoOrUnix === "number"
      ? new Date(isoOrUnix * 1000)
      : new Date(isoOrUnix);
  try {
    return new Intl.DateTimeFormat("fr-CA", {
      timeZone,
      dateStyle: "medium",
      timeStyle: "short",
      ...options,
    }).format(date);
  } catch {
    return date.toLocaleString("fr-CA");
  }
}

export function formatTimeInTimezone(
  isoOrUnix: string | number,
  timeZone: string,
): string {
  return formatDateTimeInTimezone(isoOrUnix, timeZone, {
    dateStyle: undefined,
    timeStyle: "short",
  });
}

export function truncateAlertDescription(
  text: string,
  maxLength = 280,
): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 1).trimEnd()}…`;
}

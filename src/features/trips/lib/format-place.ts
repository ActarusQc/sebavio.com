/** Libellé lieu compact : « Ville, QC » ou repli sur l’adresse. */
export function formatPlaceLabel(
  city: string | null | undefined,
  province: string | null | undefined,
  fallback: string,
): string {
  const c = city?.trim();
  const p = province?.trim();
  if (c && p) return `${c}, ${p}`;
  if (c) return c;
  return fallback.trim() || "—";
}

/** Plage de dates voyage en français canadien. */
export function formatTripDateRange(
  departureDate: string,
  returnDate: string | null | undefined,
): string {
  const parse = (raw: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return new Date(`${raw}T12:00:00`);
    }
    return new Date(raw);
  };

  const start = parse(departureDate);
  if (Number.isNaN(start.getTime())) return "—";

  const fmtDayMonth = (d: Date) =>
    d.toLocaleDateString("fr-CA", {
      day: "numeric",
      month: "long",
    });

  if (!returnDate) {
    return start.toLocaleDateString("fr-CA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  const end = parse(returnDate);
  if (Number.isNaN(end.getTime())) {
    return start.toLocaleDateString("fr-CA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return `${fmtDayMonth(start)} – ${fmtDayMonth(end)} ${end.getFullYear()}`;
}

/** Heure courte depuis ISO ou « HH:MM ». */
export function formatClockTime(isoOrTime: string | null | undefined): string {
  if (!isoOrTime) return "—";
  if (/^\d{1,2}:\d{2}/.test(isoOrTime)) {
    const [h, m] = isoOrTime.split(":");
    return `${h.padStart(2, "0")} h ${m}`;
  }
  const d = new Date(isoOrTime);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("fr-CA", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Relative time FR pour fraîcheur d’analyse. */
export function formatRelativeFr(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diffMs = Date.now() - t;
  if (diffMs < 0) return "à l’instant";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "à l’instant";
  if (mins < 60) return `il y a ${mins} minute${mins > 1 ? "s" : ""}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} heure${hours > 1 ? "s" : ""}`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} jour${days > 1 ? "s" : ""}`;
}

import type { NormalizedSafetyRecall, TransportCanadaItem } from "./types";

function asString(v: string | number | undefined | null): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

function asYear(v: string | number | undefined | null): number | null {
  const s = asString(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isInteger(n) && n > 1900 && n < 2100 ? n : null;
}

/**
 * Normalise un enregistrement Transport Canada / open data vers le format interne.
 */
export function normalizeTransportCanadaItem(
  item: TransportCanadaItem,
): NormalizedSafetyRecall | null {
  const externalRecallId =
    asString(item.recall_number) ??
    asString(item.RecallNumber) ??
    asString(item.id);
  if (!externalRecallId) return null;

  const title =
    asString(item.recall_name_en) ??
    asString(item.Name) ??
    asString(item.title) ??
    `Rappel ${externalRecallId}`;

  const year =
    asYear(item.year) ?? asYear(item.Year) ?? asYear(item.model_year);

  const officialUrl =
    asString(item.url) ??
    asString(item.Url) ??
    `https://wwwapps.tc.gc.ca/Saf-Sec-Sur/7/VRDB-BDRV/search-recherche/results-resultats.aspx?lang=eng&mk=${encodeURIComponent(asString(item.make_name) ?? asString(item.MakeName) ?? "")}&md=${encodeURIComponent(asString(item.model_name) ?? asString(item.ModelName) ?? "")}&fy=${year ?? ""}&ty=${year ?? ""}`;

  return {
    externalRecallId,
    source: "transport_canada",
    manufacturer:
      asString(item.manufacturer_name) ??
      asString(item.ManufacturerName) ??
      asString(item.make_name) ??
      asString(item.MakeName) ??
      undefined,
    model: asString(item.model_name) ?? asString(item.ModelName) ?? undefined,
    year: year ?? undefined,
    title,
    summary: asString(item.summary_en) ?? asString(item.Summary) ?? undefined,
    riskDescription:
      asString(item.consequence_en) ?? asString(item.Consequence) ?? undefined,
    correctiveAction:
      asString(item.corrective_action_en) ??
      asString(item.CorrectiveAction) ??
      undefined,
    recallDate:
      asString(item.recall_date) ?? asString(item.RecallDate) ?? undefined,
    officialUrl,
    // Sans confirmation VIN exacte, toujours marquer comme incertain.
    vinMatchUncertain: true,
  };
}

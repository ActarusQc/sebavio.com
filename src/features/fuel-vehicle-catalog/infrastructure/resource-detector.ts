import type {
  CatalogResourceKind,
  OfficialCatalogResource,
} from "../domain/types";
import { getVehicleCatalogEnv } from "./config";
import { fetchOfficialJson } from "./http-client";

type CkanResource = {
  id: string;
  name?: string;
  url?: string;
  format?: string;
  last_modified?: string | null;
  created?: string | null;
  size?: number | null;
  language?: string | string[] | null;
};

type CkanPackageShow = {
  success: boolean;
  result?: {
    id: string;
    title?: string;
    resources?: CkanResource[];
  };
};

function detectLanguage(
  name: string,
  url: string,
  language: CkanResource["language"],
): "en" | "fr" | "unknown" {
  const blob = `${name} ${url}`.toLowerCase();
  if (Array.isArray(language)) {
    const joined = language.join(" ").toLowerCase();
    if (joined.includes("fr")) return "fr";
    if (joined.includes("en")) return "en";
  } else if (typeof language === "string") {
    if (language.toLowerCase().includes("fr")) return "fr";
    if (language.toLowerCase().includes("en")) return "en";
  }
  if (
    blob.includes("am20") ||
    blob.includes("cotes-de-consommation") ||
    blob.includes("vehicules-") ||
    blob.includes("année") ||
    /\bam\d{4}/.test(blob)
  ) {
    return "fr";
  }
  if (
    blob.includes("my20") ||
    blob.includes("fuel-consumption") ||
    /\bmy\d{4}/.test(blob)
  ) {
    return "en";
  }
  return "unknown";
}

function detectKind(name: string, url: string): CatalogResourceKind {
  const blob = `${name} ${url}`.toLowerCase();
  if (
    blob.includes("battery-electric") ||
    blob.includes("vehicules-electriques-a-batterie") ||
    blob.includes("véhicules électriques à batterie")
  ) {
    return "bev";
  }
  if (
    blob.includes("plug-in") ||
    blob.includes("plugin") ||
    blob.includes("hybrides-electriques-rechargeables") ||
    blob.includes("rechargeable")
  ) {
    return "phev";
  }
  if (
    blob.includes("fuel consumption") ||
    blob.includes("cotes-de-consommation") ||
    blob.includes("cotes de consommation")
  ) {
    return "conventional";
  }
  return "unknown";
}

function isOriginalTwoCycle(name: string, url: string): boolean {
  const blob = `${name} ${url}`.toLowerCase();
  return (
    blob.includes("original") ||
    blob.includes("2-cycle") ||
    blob.includes("deux-cycles") ||
    blob.includes("two-cycle")
  );
}

/**
 * Sélectionne les ressources CSV utiles : EN ou FR selon préférence,
 * 5-cycle pour 1995-2014, + BEV + PHEV. Ignore XLSX et doublons.
 */
export function selectImportResources(
  resources: OfficialCatalogResource[],
  preferLanguage: "en" | "fr",
): OfficialCatalogResource[] {
  const csv = resources.filter(
    (r) =>
      r.format.toUpperCase() === "CSV" &&
      r.url.toLowerCase().includes("download") &&
      !isOriginalTwoCycle(r.name, r.url),
  );

  const byKind = new Map<CatalogResourceKind, OfficialCatalogResource[]>();
  for (const r of csv) {
    if (r.kind === "unknown") continue;
    const list = byKind.get(r.kind) ?? [];
    list.push(r);
    byKind.set(r.kind, list);
  }

  const picked: OfficialCatalogResource[] = [];
  for (const kind of ["conventional", "bev", "phev"] as const) {
    const list = byKind.get(kind) ?? [];
    const preferred = list.filter((r) => r.language === preferLanguage);
    const fallback = preferred.length > 0 ? preferred : list;
    // Dédupliquer par pluriannuel vs annuel : garder tous les fichiers
    // distincts (2026, 2025, 2015-2024, 1995-2014) via URL basename.
    const seen = new Set<string>();
    for (const r of fallback) {
      const key = r.url.split("/").pop()?.toLowerCase() ?? r.id;
      // Normaliser am/my pour éviter double import FR+EN
      const normalized = key
        .replace(/^am/, "my")
        .replace(
          /cotes-de-consommation-de-carburant/g,
          "fuel-consumption-ratings",
        )
        .replace(
          /vehicules-electriques-a-batterie/g,
          "battery-electric-vehicles",
        )
        .replace(
          /vehicules-hybrides-electriques-rechargeables/g,
          "plug-in-hybrid-electric-vehicles",
        );
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      picked.push(r);
    }
  }

  return picked;
}

export async function discoverOfficialResources(): Promise<{
  datasetId: string;
  datasetTitle: string | null;
  resources: OfficialCatalogResource[];
  selected: OfficialCatalogResource[];
}> {
  const env = getVehicleCatalogEnv();
  const payload = await fetchOfficialJson<CkanPackageShow>(env.datasetApiUrl);
  if (!payload.success || !payload.result?.resources) {
    throw new Error("Réponse CKAN invalide pour le jeu de données NRCan");
  }

  const resources: OfficialCatalogResource[] = payload.result.resources
    .filter((r) => r.url && r.id)
    .map((r) => {
      const name = r.name ?? r.url ?? r.id;
      const url = r.url!;
      return {
        id: r.id,
        name,
        url,
        format: (r.format ?? "").toUpperCase(),
        language: detectLanguage(name, url, r.language),
        kind: detectKind(name, url),
        lastModified: r.last_modified
          ? new Date(r.last_modified)
          : r.created
            ? new Date(r.created)
            : null,
        size: typeof r.size === "number" ? r.size : null,
      };
    });

  return {
    datasetId: payload.result.id,
    datasetTitle: payload.result.title ?? null,
    resources,
    selected: selectImportResources(resources, env.preferLanguage),
  };
}

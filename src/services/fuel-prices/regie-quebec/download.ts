const GEOJSON_URL = "https://regieessencequebec.ca/stations.geojson.gz";
const BASE_URL = "https://regieessencequebec.ca";
const FETCH_TIMEOUT_MS = 60_000;

export type ResolvedExcelSource = {
  url: string;
  generatedAt: string | null;
  totalStationsHint: number | null;
};

/**
 * Résout l'URL du fichier Excel courant.
 * 1. REGIE_ESSENCE_XLSX_URL si défini
 * 2. Sinon metadata.excel_url dans stations.geojson.gz
 */
export async function resolveRegieExcelUrl(
  overrideUrl?: string,
): Promise<ResolvedExcelSource> {
  const envUrl =
    overrideUrl?.trim() || process.env.REGIE_ESSENCE_XLSX_URL?.trim() || "";

  if (envUrl) {
    return {
      url: envUrl,
      generatedAt: null,
      totalStationsHint: null,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(GEOJSON_URL, {
      signal: controller.signal,
      headers: { Accept: "application/geo+json, application/gzip, */*" },
    });
    if (!res.ok) {
      throw new Error(`GeoJSON Régie HTTP ${res.status}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    let text: string;
    // fetch peut déjà décompresser Content-Encoding: gzip
    if (buf[0] === 0x1f && buf[1] === 0x8b) {
      const { gunzipSync } = await import("node:zlib");
      text = gunzipSync(buf).toString("utf8");
    } else {
      text = buf.toString("utf8");
    }
    const json = JSON.parse(text) as {
      metadata?: {
        excel_url?: string;
        generated_at?: string;
        total_stations?: number;
      };
    };
    const path = json.metadata?.excel_url;
    if (!path) {
      throw new Error("metadata.excel_url absent du GeoJSON Régie");
    }
    const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
    return {
      url,
      generatedAt: json.metadata?.generated_at ?? null,
      totalStationsHint: json.metadata?.total_stations ?? null,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function downloadRegieExcel(url: string): Promise<Buffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Téléchargement Excel HTTP ${res.status}`);
    }
    return Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

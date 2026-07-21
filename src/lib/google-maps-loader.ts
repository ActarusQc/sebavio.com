/**
 * Chargeur unique Maps JavaScript API (+ Places) pour le navigateur.
 * Évite les chargements multiples du script Google.
 *
 * Avec `loading=async`, `script.onload` peut se déclencher avant que
 * `google.maps.importLibrary` soit disponible — il faut attendre l’importer.
 */

export type GoogleMapsLibrary = "maps" | "places";

type LoadOptions = {
  /** Bibliothèques à garantir (défaut : maps). */
  libraries?: GoogleMapsLibrary[];
};

declare global {
  interface Window {
    google?: {
      maps?: {
        importLibrary?: (name: string) => Promise<unknown>;
        Map?: unknown;
        Marker?: unknown;
        Polyline?: unknown;
        LatLngBounds?: unknown;
        [key: string]: unknown;
      };
    };
  }
}

let loadPromise: Promise<void> | null = null;

const IMPORT_LIBRARY_MAX_ATTEMPTS = 100;
const IMPORT_LIBRARY_POLL_MS = 50;

function clientApiKey(): string | null {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || null;
}

function scriptSrc(apiKey: string, libraries: GoogleMapsLibrary[]): string {
  const params = new URLSearchParams({
    key: apiKey,
    v: "weekly",
    loading: "async",
  });
  const unique = Array.from(new Set(libraries));
  if (unique.length > 0) {
    params.set("libraries", unique.join(","));
  }
  return `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
}

function waitForImportLibrary(): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const tick = () => {
      if (window.google?.maps?.importLibrary) {
        resolve();
        return;
      }
      attempts += 1;
      if (attempts >= IMPORT_LIBRARY_MAX_ATTEMPTS) {
        reject(new Error("Google Maps importLibrary indisponible"));
        return;
      }
      window.setTimeout(tick, IMPORT_LIBRARY_POLL_MS);
    };
    tick();
  });
}

function ensureGoogleMapsScript(
  apiKey: string,
  libraries: GoogleMapsLibrary[],
): Promise<void> {
  if (window.google?.maps?.importLibrary) {
    return Promise.resolve();
  }

  const existing = document.querySelector<HTMLScriptElement>(
    "script[data-sebavio-google-maps]",
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener(
        "error",
        () => reject(new Error("Google Maps script error")),
        { once: true },
      );
      // Qu’il soit déjà chargé ou non : poller jusqu’à importLibrary.
      void waitForImportLibrary().then(resolve).catch(reject);
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = scriptSrc(apiKey, libraries);
    script.async = true;
    script.defer = true;
    script.dataset.sebavioGoogleMaps = "1";
    script.onerror = () => reject(new Error("Google Maps script error"));
    script.onload = () => {
      void waitForImportLibrary().then(resolve).catch(reject);
    };
    document.head.appendChild(script);
  });
}

/**
 * Charge le script Google Maps une seule fois.
 * Ne journalise jamais la clé API.
 */
export function loadGoogleMaps(options: LoadOptions = {}): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("client only"));
  }

  const libraries = options.libraries ?? ["maps"];
  const apiKey = clientApiKey();
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps non configuré"));
  }

  if (window.google?.maps?.importLibrary) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = ensureGoogleMapsScript(apiKey, libraries).catch((error) => {
    loadPromise = null;
    throw error;
  });

  return loadPromise;
}

export async function importGoogleLibrary<T = unknown>(
  name: GoogleMapsLibrary,
): Promise<T> {
  await loadGoogleMaps({ libraries: ["maps", "places"] });
  const importer = window.google?.maps?.importLibrary;
  if (!importer) {
    await waitForImportLibrary();
  }
  const ready = window.google?.maps?.importLibrary;
  if (!ready) {
    throw new Error("Google Maps importLibrary indisponible");
  }
  return ready(name) as Promise<T>;
}

export function hasGoogleMapsApiKey(): boolean {
  return Boolean(clientApiKey());
}

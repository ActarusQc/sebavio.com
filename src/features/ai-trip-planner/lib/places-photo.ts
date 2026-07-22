/**
 * URL proxy pour une photo Google Places (New).
 * `photoName` = ex. "places/ChIJ…/photos/AUacSh…"
 */
export function buildPlacesPhotoProxyUrl(
  photoName: string | null | undefined,
  maxWidthPx = 320,
): string | null {
  const name = photoName?.trim();
  if (!name) return null;
  if (!name.startsWith("places/") || !name.includes("/photos/")) return null;
  const params = new URLSearchParams({
    name,
    maxWidthPx: String(Math.min(1200, Math.max(64, maxWidthPx))),
  });
  return `/api/places/photo?${params.toString()}`;
}

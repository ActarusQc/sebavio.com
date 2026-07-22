import { describe, expect, it } from "vitest";
import { buildPlacesPhotoProxyUrl } from "@/features/ai-trip-planner/lib/places-photo";

describe("buildPlacesPhotoProxyUrl", () => {
  it("construit une URL proxy valide", () => {
    const url = buildPlacesPhotoProxyUrl(
      "places/ChIJtest/photos/AUacShjPhoto",
      320,
    );
    expect(url).toContain("/api/places/photo?");
    expect(url).toContain("name=places%2FChIJtest%2Fphotos%2FAUacShjPhoto");
    expect(url).toContain("maxWidthPx=320");
  });

  it("rejette les références invalides", () => {
    expect(buildPlacesPhotoProxyUrl(null)).toBeNull();
    expect(buildPlacesPhotoProxyUrl("https://evil.example/x")).toBeNull();
    expect(buildPlacesPhotoProxyUrl("places/only")).toBeNull();
  });
});

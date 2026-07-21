import { describe, expect, it } from "vitest";
import type { AddressSelection } from "@/types/address";

/**
 * Miroir de la logique d'invalidation : une modification du texte après
 * sélection Google doit vider les métadonnées geo (placeId / coords).
 */
function invalidateOnTextEdit(
  previous: AddressSelection | null,
  nextText: string,
): AddressSelection | null {
  if (!previous) return null;
  if (nextText.trim() === previous.formattedAddress.trim()) return previous;
  return null;
}

describe("address selection invalidation", () => {
  const selected: AddressSelection = {
    formattedAddress: "100 Rue Notre-Dame E, Montréal, QC H2Y 1C1, Canada",
    placeId: "ChIJabc",
    latitude: 45.5088,
    longitude: -73.554,
    streetNumber: "100",
    route: "Rue Notre-Dame E",
    city: "Montréal",
    province: "QC",
    postalCode: "H2Y 1C1",
    country: "CA",
  };

  it("conserve la sélection si le texte est inchangé", () => {
    expect(invalidateOnTextEdit(selected, selected.formattedAddress)).toEqual(
      selected,
    );
  });

  it("invalide placeId et coords si le texte change", () => {
    expect(invalidateOnTextEdit(selected, "Montréal modifié")).toBeNull();
  });

  it("reste null en saisie manuelle", () => {
    expect(invalidateOnTextEdit(null, "Adresse libre")).toBeNull();
  });
});

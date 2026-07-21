/**
 * Filtrage des avertissements carburant destinés à l'utilisateur.
 */
import { describe, expect, it } from "vitest";
import {
  toUserFuelWarnings,
  USER_FUEL_WARNING_COPY,
} from "@/features/fuel/lib/user-fuel-warnings";

describe("toUserFuelWarnings", () => {
  it("remplace les diagnostics techniques par un message convivial", () => {
    const out = toUserFuelWarnings([
      "Prix vieillissant — susceptibles de changer.",
      "Identifiant de prix partagé 1.979 $/L sur 8 stations — traité comme estimation régionale.",
      "Couverture corridor : 126 stations détectées (15 prix exacts, 0 estimations ville, 111 estimations régionales, 0 sans prix, 33 valeurs distinctes, 33 identifiants de prix, 126 candidates, 2 arrêt(s)).",
    ]);
    expect(out.some((w) => /Identifiant de prix partagé/i.test(w))).toBe(false);
    expect(out.some((w) => /Couverture corridor/i.test(w))).toBe(false);
    expect(out.some((w) => /stations détectées/i.test(w))).toBe(false);
    expect(out.some((w) => /candidates/i.test(w))).toBe(false);
    expect(out.some((w) => /estimations régionales/i.test(w))).toBe(false);
    expect(out).toContain(USER_FUEL_WARNING_COPY.mayHaveChanged);
    expect(out).toContain(USER_FUEL_WARNING_COPY.estimate);
  });

  it("conserve un avertissement métier lisible", () => {
    const out = toUserFuelWarnings([
      "Aucun arrêt carburant accessible n’a été trouvé avant la limite d’autonomie du véhicule.",
    ]);
    expect(out.some((w) => /Aucun arrêt carburant accessible/i.test(w))).toBe(
      true,
    );
  });

  it("force un avis d'estimation lorsque demandé", () => {
    const out = toUserFuelWarnings([], { forceEstimateNotice: true });
    expect(out).toEqual([USER_FUEL_WARNING_COPY.estimate]);
  });
});

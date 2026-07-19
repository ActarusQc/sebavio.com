import { describe, expect, it } from "vitest";
import {
  isJwtSessionVersionMismatch,
  nextSessionVersion,
} from "@/features/admin/lib/session-version";

describe("sessionVersion / JWT", () => {
  it("incrémente la version de session", () => {
    expect(nextSessionVersion(0)).toBe(1);
    expect(nextSessionVersion(4)).toBe(5);
  });

  it("traite une version invalide comme départ à 1", () => {
    expect(nextSessionVersion(-1)).toBe(1);
    expect(nextSessionVersion(Number.NaN)).toBe(1);
  });

  it("détecte un décalage JWT / DB (révocation)", () => {
    expect(isJwtSessionVersionMismatch(0, 1)).toBe(true);
    expect(isJwtSessionVersionMismatch(2, 2)).toBe(false);
    expect(isJwtSessionVersionMismatch(undefined, 3)).toBe(true);
    expect(isJwtSessionVersionMismatch(null, 0)).toBe(false);
  });
});

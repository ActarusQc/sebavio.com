import { describe, expect, it } from "vitest";
import { csvCell, neutralizeCsvFormula } from "@/features/admin/lib/csv";

describe("export CSV — neutralisation formules", () => {
  it("préfixe les formules dangereuses", () => {
    expect(neutralizeCsvFormula("=1+1")).toBe("'=1+1");
    expect(neutralizeCsvFormula("+cmd")).toBe("'+cmd");
    expect(neutralizeCsvFormula("-2")).toBe("'-2");
    expect(neutralizeCsvFormula("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("laisse les valeurs sûres intactes", () => {
    expect(neutralizeCsvFormula("user@sebavio.local")).toBe(
      "user@sebavio.local",
    );
    expect(neutralizeCsvFormula("texte normal")).toBe("texte normal");
  });

  it("échappe les guillemets et séparateurs", () => {
    expect(csvCell('dit "bonjour"')).toBe('"dit ""bonjour"""');
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell("=HYPERLINK()")).toBe("'=HYPERLINK()");
  });
});

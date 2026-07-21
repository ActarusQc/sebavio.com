import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("design tokens", () => {
  it("définit la palette de marque et les accents fonctionnels", () => {
    const tokens = readFileSync(
      resolve(__dirname, "../../src/styles/tokens.css"),
      "utf8",
    );
    expect(tokens).toContain("--sebavio-navy");
    expect(tokens).toContain("--sebavio-slate");
    expect(tokens).toContain("--sebavio-gold");
    expect(tokens).toContain("--sebavio-green-600");
    expect(tokens).toContain("--sebavio-blue-500");
    expect(tokens).toContain("--sebavio-orange-500");
    expect(tokens).toContain("--space-1: 0.5rem");
    expect(tokens).toContain("--radius-card");
  });

  it("mappe les tokens sémantiques dans globals.css", () => {
    const css = readFileSync(
      resolve(__dirname, "../../src/app/globals.css"),
      "utf8",
    );
    expect(css).toContain("--color-success");
    expect(css).toContain("--color-info");
    expect(css).toContain("--color-warning");
    expect(css).toContain("prefers-reduced-motion");
  });
});

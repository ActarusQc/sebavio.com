import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  MAIN_NAV_ITEMS,
  getVisibleNavItems,
  isNavItemActive,
  buildBreadcrumbs,
} from "@/components/layout/navigation";
import { HeaderSearch } from "@/components/layout/header-search";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

describe("navigation — rôles", () => {
  it("masque Administration pour le rôle user", () => {
    const items = getVisibleNavItems("user");
    expect(items.some((item) => item.href === "/admin")).toBe(false);
    expect(items.some((item) => item.href === "/dashboard/catalog")).toBe(true);
    expect(items.some((item) => item.href === "/dashboard/subscription")).toBe(
      true,
    );
  });

  it("affiche Administration pour admin et super_admin", () => {
    expect(
      getVisibleNavItems("admin").some((item) => item.href === "/admin"),
    ).toBe(true);
    expect(
      getVisibleNavItems("super_admin").some((item) => item.href === "/admin"),
    ).toBe(true);
  });

  it("ne définit pas d’entrées menu pour weather/fuel/campings/activities/maps", () => {
    const features = MAIN_NAV_ITEMS.map((item) => item.feature);
    for (const feature of [
      "weather",
      "fuel",
      "campings",
      "activities",
      "maps",
    ]) {
      expect(features).not.toContain(feature);
    }
  });
});

describe("navigation — actif et breadcrumbs", () => {
  it("marque uniquement /dashboard comme actif à la racine", () => {
    expect(isNavItemActive("/dashboard", "/dashboard")).toBe(true);
    expect(isNavItemActive("/dashboard", "/dashboard/trips")).toBe(false);
    expect(isNavItemActive("/dashboard/trips", "/dashboard/trips")).toBe(true);
  });

  it("construit le fil d’Ariane pour un module", () => {
    expect(buildBreadcrumbs("/dashboard/trips")).toEqual([
      { label: "Tableau de bord", href: "/dashboard" },
      { label: "Voyages" },
    ]);
  });

  it("construit le fil d’Ariane pour le tableau de bord", () => {
    expect(buildBreadcrumbs("/dashboard")).toEqual([
      { label: "Tableau de bord" },
    ]);
  });
});

describe("HeaderSearch", () => {
  it("affiche un placeholder non fonctionnel explicite", () => {
    render(<HeaderSearch />);
    const input = screen.getByRole("searchbox", {
      name: "Recherche — à venir",
    });
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("placeholder", "Recherche — à venir");
  });
});

describe("Breadcrumbs (navigation)", () => {
  it("lie le parent et marque la page courante", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "Tableau de bord", href: "/dashboard" },
          { label: "Voyages" },
        ]}
      />,
    );
    expect(
      screen.getByRole("link", { name: "Tableau de bord" }),
    ).toHaveAttribute("href", "/dashboard");
    expect(screen.getByText("Voyages")).toHaveAttribute("aria-current", "page");
  });
});

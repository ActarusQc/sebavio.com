/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormField } from "@/components/common/form-field";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

describe("FormField", () => {
  it("associe le label au champ via htmlFor", () => {
    render(
      <FormField htmlFor="email" label="Courriel" required>
        <input id="email" name="email" />
      </FormField>,
    );
    expect(screen.getByLabelText(/Courriel/)).toBeInTheDocument();
  });

  it("affiche le message d’erreur avec role alert", () => {
    render(
      <FormField htmlFor="email" label="Courriel" error="Champ invalide">
        <input id="email" name="email" />
      </FormField>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Champ invalide");
  });
});

describe("StatusBadge", () => {
  it("applique le statut success", () => {
    render(<StatusBadge status="success">OK</StatusBadge>);
    expect(screen.getByText("OK")).toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("affiche titre et description", () => {
    render(<EmptyState title="Vide" description="Aucune donnée" />);
    expect(screen.getByText("Vide")).toBeInTheDocument();
    expect(screen.getByText("Aucune donnée")).toBeInTheDocument();
  });
});

describe("PageHeader", () => {
  it("affiche le titre de page", () => {
    render(<PageHeader title="Tableau de bord" />);
    expect(
      screen.getByRole("heading", { name: "Tableau de bord" }),
    ).toBeInTheDocument();
  });
});

describe("Breadcrumbs", () => {
  it("marque la page courante", () => {
    render(
      <Breadcrumbs
        items={[{ label: "Accueil", href: "/" }, { label: "Voyages" }]}
      />,
    );
    expect(screen.getByText("Voyages")).toHaveAttribute("aria-current", "page");
  });
});

/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UserMenu } from "@/components/layout/user-menu";
import { logoutAction } from "@/features/auth/actions";

vi.mock("@/features/auth/actions", () => ({
  logoutAction: vi.fn(),
}));

describe("UserMenu", () => {
  it("ouvre le menu avec Paramètres et Déconnexion", async () => {
    render(<UserMenu email="demo@sebavio.com" role="user" />);

    fireEvent.click(screen.getByRole("button", { name: "Menu profil" }));

    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: "Paramètres" }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("menuitem", { name: "Paramètres" }),
    ).toHaveAttribute("href", "/dashboard/settings");
    expect(
      screen.getByRole("menuitem", { name: "Déconnexion" }),
    ).toBeInTheDocument();
  });

  it("appelle logoutAction au clic sur Déconnexion", async () => {
    render(<UserMenu email="demo@sebavio.com" role="user" />);

    fireEvent.click(screen.getByRole("button", { name: "Menu profil" }));

    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: "Déconnexion" }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("menuitem", { name: "Déconnexion" }));

    expect(logoutAction).toHaveBeenCalledTimes(1);
  });
});

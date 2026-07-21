import { expect, test } from "@playwright/test";

/**
 * Parcours E2E catalogue NRCan.
 * Nécessite un utilisateur déjà authentifié (storageState projet) et un catalogue syncé.
 * Si le couple 2022/Toyota/RAV4 n'existe pas, le test sélectionne la première config disponible.
 */
test.describe("Ajout véhicule via catalogue NRCan", () => {
  test.skip(
    !process.env.E2E_STORAGE_STATE,
    "E2E_STORAGE_STATE requis pour le parcours authentifié",
  );

  test("sélection progressive → création → conso officielle", async ({
    page,
  }) => {
    await page.goto("/dashboard/vehicles/new");
    await expect(page.getByLabel("Année")).toBeVisible({ timeout: 15000 });

    const yearSelect = page.getByLabel("Année");
    await yearSelect.selectOption({ label: "2022" });

    await expect(page.getByLabel("Marque")).toBeEnabled({ timeout: 10000 });
    const makeSelect = page.getByLabel("Marque");
    const makeOptions = await makeSelect.locator("option").allTextContents();
    const toyota = makeOptions.find((o) => o.trim() === "Toyota");
    if (toyota) {
      await makeSelect.selectOption({ label: "Toyota" });
    } else {
      const first = makeOptions.find((o) => o.trim() && o !== "Choisir…");
      test.skip(!first, "Aucune marque catalogue");
      await makeSelect.selectOption({ label: first!.trim() });
    }

    await expect(page.getByLabel("Modèle")).toBeEnabled({ timeout: 10000 });
    const modelSelect = page.getByLabel("Modèle");
    const modelOptions = await modelSelect.locator("option").allTextContents();
    const rav = modelOptions.find((o) => o.toUpperCase().includes("RAV4"));
    const model =
      rav?.trim() ||
      modelOptions.find((o) => o.trim() && !o.includes("Choisir"))?.trim();
    test.skip(!model, "Aucun modèle catalogue");
    await modelSelect.selectOption({ label: model! });

    await expect(page.getByLabel("Configuration")).toBeEnabled({
      timeout: 10000,
    });
    const configSelect = page.getByLabel("Configuration");
    const configOptions = await configSelect
      .locator("option")
      .allTextContents();
    const config = configOptions.find(
      (o) => o.trim() && !o.includes("Choisir"),
    );
    test.skip(!config, "Aucune configuration");
    await configSelect.selectOption({ label: config!.trim() });

    await expect(page.getByText(/Consommation officielle/i)).toBeVisible();
    await expect(page.getByText(/Ressources naturelles Canada/i)).toBeVisible();

    await page.getByLabel("Kilométrage").fill("12500");
    await page.getByRole("button", { name: /Créer le véhicule/i }).click();

    await expect(page).toHaveURL(/\/dashboard\/vehicles\//, { timeout: 15000 });
  });
});

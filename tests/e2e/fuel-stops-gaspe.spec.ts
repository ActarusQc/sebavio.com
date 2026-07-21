import { expect, test } from "@playwright/test";

/**
 * E2E — arrêts carburant sur le voyage Gaspé réel (propriétaire).
 * URL HTTPS (cookies Secure Auth.js).
 */
const GASPE_TRIP_ID =
  process.env.E2E_GASPE_TRIP_ID ?? "915d87de-2cc5-4c9d-b20f-2e4524bca537";
const EMAIL = process.env.E2E_EMAIL ?? "daniel@sdgdigital.com";
const PASSWORD = process.env.SEED_PASSWORD ?? process.env.E2E_PASSWORD ?? "";

test.describe("Arrêts carburant voyage Gaspé", () => {
  test.skip(!PASSWORD, "SEED_PASSWORD / E2E_PASSWORD requis");

  test("affiche PLAN DE RAVITAILLEMENT aller/retour et focus carte", async ({
    page,
  }) => {
    test.setTimeout(180_000);

    await page.goto("/login");
    await page.locator("#email").fill(EMAIL);
    await page.locator("#password").fill(PASSWORD);
    await page.getByRole("button", { name: /se connecter/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 30000 });

    await page.goto(`/dashboard/trips/${GASPE_TRIP_ID}`);
    await expect(page.getByTestId("trip-fuel-estimate-panel")).toBeVisible({
      timeout: 20000,
    });

    const returnCheckbox = page.getByTestId("include-return-trip");
    if (await returnCheckbox.count()) {
      if (!(await returnCheckbox.isChecked())) {
        await returnCheckbox.check({ force: true });
      }
    }

    // Si le flux demande un prix manuel, le fournir
    const manualError = page.getByText(/Entrez un prix manuel/i);
    if (await manualError.isVisible().catch(() => false)) {
      const force = page.getByLabel(/Forcer un prix manuel/i);
      if (await force.count()) await force.check({ force: true });
      const price = page.locator("#est-price");
      if (await price.count()) await price.fill("1.650");
      await page.getByRole("button", { name: /Recalculer/i }).click();
    }

    await expect(page.getByTestId("fuel-stops-list")).toBeVisible({
      timeout: 120_000,
    });
    await expect(page.getByText(/Plan de ravitaillement/i)).toBeVisible();
    await expect(page.getByTestId("fuel-plan-outbound")).toBeVisible();
    await expect(page.getByTestId("fuel-plan-return")).toBeVisible();

    await expect(page.getByText(/Arrêt carburant/i).first()).toBeVisible();
    await expect(page.getByText(/km du départ/i).first()).toBeVisible();

    await expect(
      page
        .getByText(
          /Près de |Station exacte à confirmer|Rimouski|Saint-|Costco|Petro|Couche/i,
        )
        .first(),
    ).toBeVisible();

    const mapBtn = page
      .getByRole("button", {
        name: /Voir (sur la carte|la zone sur la carte)/i,
      })
      .first();
    await expect(mapBtn).toBeVisible();
    await mapBtn.click();
    await expect(page.locator("#trip-map-section")).toBeVisible();

    // Capturer les textes d'arrêts visibles pour le rapport
    const cards = page.locator('[data-testid^="fuel-stop-"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(2);

    await page.screenshot({
      path: "tests/e2e/artifacts/fuel-stops-gaspe.png",
      fullPage: true,
    });
  });
});

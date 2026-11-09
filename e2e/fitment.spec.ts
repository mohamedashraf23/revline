import { expect, test } from "@playwright/test";

/**
 * The journey the dataset exists for: pick a real vehicle out of 1,193
 * nameplates, and have the catalogue narrow to parts that fit it.
 */

test.describe("vehicle finder and fitment", () => {
  test("the type-ahead finds a model and saves it as the active vehicle", async ({ page }) => {
    await page.goto("/");

    const finder = page.locator("form.finder").first();
    await finder.getByLabel("Year").selectOption("2021");

    const model = finder.getByLabel("Model", { exact: false });
    await model.fill("m340");

    // The listbox is populated from /api/vehicles/search.
    const option = page.getByRole("option", { name: /BMW M340i xDrive/ });
    await expect(option).toBeVisible();
    await option.click();

    await finder.getByRole("button", { name: /Find Parts/ }).click();

    // Lands on the filtered shop with the vehicle in the header chip.
    await expect(page).toHaveURL(/\/shop\?fits=1/);
    await expect(page.getByRole("button", { name: /2021 BMW M340i xDrive/ })).toBeVisible();
    await expect(page.getByText(/Showing parts that fit your/)).toBeVisible();
  });

  test("the cascade narrows models by year", async ({ page }) => {
    await page.goto("/");

    const finder = page.locator("form.finder").first();
    await finder.getByLabel("Make").selectOption("porsche");

    const models = finder.getByLabel(/Porsche models/);
    await expect(models).toBeVisible();
    const allCount = await models.locator("option").count();

    await finder.getByLabel("Year").selectOption("2015");
    // Re-queried for that year, so the list should shrink.
    await expect
      .poll(async () => models.locator("option").count(), { timeout: 10_000 })
      .toBeLessThan(allCount);
  });

  test("fits-only filtering shows only parts that fit, and can be turned off", async ({ page }) => {
    await page.goto("/");
    const finder = page.locator("form.finder").first();
    await finder.getByLabel("Year").selectOption("2021");
    await finder.getByLabel("Make").selectOption("bmw");
    // Options are keyed by model slug, which is stable; the visible label
    // carries the year range and selectOption does not take a regex.
    await finder.getByLabel(/BMW models/).selectOption("bmw-m340i-xdrive");
    await finder.getByRole("button", { name: /Find Parts/ }).click();

    await expect(page).toHaveURL(/fits=1/);

    const fittingCount = await page.locator(".result-count").innerText();

    // Every card on the page is either a fit or universal — never "Does not fit".
    await expect(page.locator(".product-card").first()).toBeVisible();
    await expect(page.locator(".fit--no")).toHaveCount(0);

    await page.getByRole("link", { name: "Show all parts" }).click();
    await expect(page.locator(".result-count")).not.toHaveText(fittingCount);

    // Page one of the unfiltered catalogue is the universal shelf (fluids,
    // filters, bulbs), so look in a category whose parts are marque-specific
    // to see a part labelled as not fitting.
    await page.goto("/shop?category=Brakes");
    await expect(page.locator(".fit--no").first()).toBeVisible();
    // And the same page still shows parts that do fit.
    await expect(page.locator(".fit--yes, .fit--universal").first()).toBeVisible();
  });

  test("the product page states fitment in full", async ({ page }) => {
    await page.goto("/shop?search=cabin%20air%20filter");
    await page.locator(".product-card").first().click();

    await expect(page.getByRole("link", { name: /Add your vehicle to confirm fitment/ })).toBeVisible();

    // The fitment tab explains universal fit rather than showing an empty table.
    await page.getByRole("tab", { name: "Fitment" }).click();
    await expect(page.getByText(/Universal fit/)).toBeVisible();
  });

  test("a model-specific part lists the nameplate it was built for", async ({ page }) => {
    await page.goto("/shop?search=cat-back%20exhaust");
    await page.locator(".product-card").first().click();

    await page.getByRole("tab", { name: "Fitment" }).click();
    const table = page.locator("table.fit-table");
    await expect(table).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Model" })).toBeVisible();
    // And the caveat about derived year data is stated, not buried.
    await expect(page.getByText(/no year column/)).toBeVisible();
  });
});

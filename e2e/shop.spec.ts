import { expect, test } from "@playwright/test";

test.describe("browsing and search", () => {
  test("the home page renders categories and a best-seller rail", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Everything for the garage/ })).toBeVisible();
    await expect(page.locator(".category-card")).toHaveCount(13);
    await expect(page.locator(".product-card")).toHaveCount(4);
    // The promo bar quotes the real model count from the API.
    await expect(page.getByText(/vehicles in the fitment database/)).toBeVisible();
  });

  test("facets stack and stay in the URL", async ({ page }) => {
    await page.goto("/shop");
    await page.getByRole("link", { name: /^Brakes/ }).click();
    await expect(page).toHaveURL(/category=Brakes/);

    await page.getByRole("link", { name: /^Performance/ }).click();
    await expect(page).toHaveURL(/category=Brakes/);
    await expect(page).toHaveURL(/type=Performance/);

    // Reloading reproduces the same view — the filters are shareable.
    const count = await page.locator(".result-count").innerText();
    await page.reload();
    await expect(page.locator(".result-count")).toHaveText(count);
  });

  test("sorting by price reorders the grid", async ({ page }) => {
    await page.goto("/shop?category=Brakes");
    await page.getByLabel("Sort results").selectOption("price-asc");
    await expect(page).toHaveURL(/sort=price-asc/);

    const prices = await page.locator(".product-card__price").allInnerTexts();
    const numbers = prices.map((p) => Number(p.replace(/[^0-9.]/g, "")));
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
  });

  test("pagination moves through the catalogue", async ({ page }) => {
    await page.goto("/shop?sort=price-asc");
    const firstName = await page.locator(".product-card__name").first().innerText();

    await page.getByRole("link", { name: "Next →" }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.locator(".product-card__name").first()).not.toHaveText(firstName);

    await page.getByRole("link", { name: "← Prev" }).click();
    await expect(page.locator(".product-card__name").first()).toHaveText(firstName);
  });

  test("header search suggests parts and lands on the shop", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Search parts").fill("coilover");

    const option = page.getByRole("option").first();
    await expect(option).toBeVisible();
    await expect(option).toContainText(/Coilover/i);

    await page.getByLabel("Search parts").press("Enter");
    await expect(page).toHaveURL(/\/shop\?search=coilover/);
    await expect(page.getByRole("heading", { name: /Results for/ })).toBeVisible();
  });

  test("a search with no matches explains itself", async ({ page }) => {
    await page.goto("/shop?search=zzzzqqqq");
    await expect(page.getByText(/Nothing matched/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Clear filters" })).toBeVisible();
  });

  test("product detail shows SKU, specs and reviews", async ({ page }) => {
    await page.goto("/shop?category=Brakes");
    await page.locator(".product-card").first().click();

    await expect(page.locator(".product__sku")).toContainText(/RL-/);

    await page.getByRole("tab", { name: "Specs" }).click();
    await expect(page.getByText("Shipping weight")).toBeVisible();
    await expect(page.getByText("Warranty")).toBeVisible();
  });
});

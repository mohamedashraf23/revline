import { expect, test, type Page } from "@playwright/test";

/** A fresh address per run, so re-running the suite never hits a duplicate. */
const uniqueEmail = () => `e2e-${Date.now()}-${Math.floor(Math.random() * 1e4)}@revline.dev`;

/** Keyed by the aria-label each field actually carries. */
const SHIPPING = {
  "Full name": "Dana Reyes",
  Address: "12 Torque Ave",
  City: "Austin",
  State: "TX",
  "ZIP code": "78701",
};

async function addFirstInStockPartToCart(page: Page) {
  await page.goto("/shop?stock=1&sort=price-asc");
  await page.locator(".product-card").first().click();
  await page.getByRole("button", { name: "Add to Cart" }).click();
  await expect(page).toHaveURL(/\/cart/);
}

test.describe("cart and checkout", () => {
  test("a guest can add a part, see server-computed totals, and check out", async ({ page }) => {
    await addFirstInStockPartToCart(page);

    await expect(page.locator(".cart-line")).toHaveCount(1);

    // The API owns the arithmetic; the page only renders it.
    const subtotal = await page.locator(".summary-row").first().innerText();
    expect(subtotal).toMatch(/\$\d/);
    await expect(page.locator(".summary-total")).toContainText("$");

    await page.getByRole("link", { name: "Checkout" }).click();
    await expect(page).toHaveURL(/\/checkout/);

    for (const [label, value] of Object.entries(SHIPPING)) {
      await page.getByLabel(label, { exact: true }).fill(value);
    }
    await page.getByLabel("Card number", { exact: true }).fill("4242424242424242");
    await page.getByLabel("Expiry", { exact: true }).fill("12/28");
    await page.getByLabel("CVV", { exact: true }).fill("123");

    await page.getByRole("button", { name: "Place Order" }).click();

    await expect(page).toHaveURL(/\/order\/\d+/);
    await expect(page.getByRole("heading", { name: "Order confirmed" })).toBeVisible();
    // Only the masked tail is ever shown or stored.
    await expect(page.getByText(/•••• 4242/)).toBeVisible();
    await expect(page.getByText("4242424242424242")).toHaveCount(0);
  });

  test("quantity changes and removal update the totals", async ({ page }) => {
    await addFirstInStockPartToCart(page);

    const lineTotal = page.locator(".cart-line__total");
    const before = await lineTotal.innerText();

    await page.getByRole("button", { name: /Increase quantity/ }).click();
    await expect(lineTotal).not.toHaveText(before);

    await page.getByRole("button", { name: /Remove /, exact: false }).first().click();
    await expect(page.getByText("Your cart is empty.")).toBeVisible();
  });

  test("the cart warns when a part does not fit the saved vehicle", async ({ page }) => {
    // Save a vehicle first.
    await page.goto("/");
    const finder = page.locator("form.finder").first();
    await finder.getByLabel("Year").selectOption("2021");
    await finder.getByLabel("Make").selectOption("bmw");
    await finder.getByLabel(/BMW models/).selectOption("bmw-m340i-xdrive");
    await finder.getByRole("button", { name: /Find Parts/ }).click();
    await expect(page).toHaveURL(/fits=1/);

    // Then deliberately add a part built for another marque.
    await page.goto("/shop?search=radiator%20ferrari");
    const card = page.locator(".product-card").first();
    await expect(card.locator(".fit--no")).toBeVisible();
    await card.click();

    const addButton = page.getByRole("button", { name: "Add to Cart" });
    if (await addButton.isEnabled()) {
      await addButton.click();
      await expect(page).toHaveURL(/\/cart/);
      await expect(page.locator(".notice--warn")).toContainText(/not listed to fit your/);
    }
  });
});

test.describe("accounts", () => {
  test("signing up keeps the guest cart and garage", async ({ page }) => {
    // Guest: save a vehicle and a part.
    await page.goto("/");
    const finder = page.locator("form.finder").first();
    await finder.getByLabel("Year").selectOption("2022");
    await finder.getByLabel("Make").selectOption("ford");
    await finder.getByLabel(/Ford models/).selectOption("ford-f-150-raptor");
    await finder.getByRole("button", { name: /Find Parts/ }).click();
    await expect(page).toHaveURL(/fits=1/);

    await page.goto("/shop?stock=1&sort=price-asc");
    await page.locator(".product-card").first().click();
    await page.getByRole("button", { name: "Add to Cart" }).click();
    await expect(page.locator(".cart-line")).toHaveCount(1);

    // Now register.
    const email = uniqueEmail();
    await page.goto("/signin?mode=signup");
    await page.getByLabel("Full name").fill("E2E Shopper");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("e2e-password-4242");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/account/);

    // The vehicle came across, and so did the basket.
    await expect(page.locator(".garage__item")).toContainText(/2022 Ford F-150 Raptor/);
    await expect(page.locator(".garage__flag")).toHaveText("Active");

    await page.goto("/cart");
    await expect(page.locator(".cart-line")).toHaveCount(1);
  });

  test("the demo account signs in and shows its two saved vehicles", async ({ page }) => {
    await page.goto("/signin");
    await page.getByLabel("Email").fill("demo@revline.dev");
    await page.getByLabel("Password").fill("revline-demo-2026");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/account/);
    await expect(page.locator(".garage__item")).toHaveCount(2);
    await expect(page.getByRole("heading", { name: "Order history" })).toBeVisible();
  });

  test("a garage vehicle can be added, switched to and removed", async ({ page }) => {
    await page.goto("/signin");
    await page.getByLabel("Email").fill("demo@revline.dev");
    await page.getByLabel("Password").fill("revline-demo-2026");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/account/);

    const before = await page.locator(".garage__item").count();

    // Adds its own vehicle rather than touching the two seeded ones — the e2e
    // database outlives a single run, so a test that deletes seeded rows would
    // break the next run's assertions about them.
    await page.getByRole("button", { name: "Add a vehicle" }).click();
    const finder = page.locator(".garage__add form.finder");
    await finder.getByLabel("Year").selectOption("2020");
    await finder.getByLabel("Make").selectOption("porsche");
    await finder.getByLabel(/Porsche models/).selectOption("porsche-911-gt3");
    await finder.getByRole("button", { name: /Find Parts/ }).click();

    // Saving navigates to the filtered shop; the new car is now active.
    await expect(page).toHaveURL(/fits=1/);
    await expect(page.getByRole("button", { name: /2020 Porsche 911 GT3/ })).toBeVisible();

    await page.goto("/account");
    await expect(page.locator(".garage__item")).toHaveCount(before + 1);
    await expect(page.locator(".garage__item--active .garage__label")).toContainText(
      "2020 Porsche 911 GT3",
    );

    // Switch back to one of the originals.
    const otherRow = page
      .locator(".garage__item")
      .filter({ has: page.getByRole("button", { name: "Use this" }) })
      .first();
    const otherLabel = (await otherRow.locator(".garage__label").innerText()).trim();
    await otherRow.getByRole("button", { name: "Use this" }).click();
    await expect(page.locator(".garage__item--active .garage__label")).toContainText(otherLabel);

    // Then clean up after itself.
    await page
      .locator(".garage__item")
      .filter({ hasText: "2020 Porsche 911 GT3" })
      .getByRole("button", { name: /^Remove / })
      .click();
    await expect(page.locator(".garage__item")).toHaveCount(before);
  });

  test("bad credentials are rejected without saying which field was wrong", async ({ page }) => {
    await page.goto("/signin");
    await page.getByLabel("Email").fill("demo@revline.dev");
    await page.getByLabel("Password").fill("definitely-not-it");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.locator(".form-error")).toContainText(/Email or password is incorrect/);
    await expect(page).toHaveURL(/\/signin/);
  });
});

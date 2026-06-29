import { test, expect } from "@playwright/test";

/**
 * Happy path through the public funnel: a visitor lands on the home page, sees
 * the pitch, and starts the flow. This runs with no real backend — it exercises
 * the app booting, client rendering, and routing in a real browser.
 */
test.describe("landing → start", () => {
  test("shows the pitch and rotates excuses", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Anything, but..." }),
    ).toBeVisible();
    await expect(
      page.getByText("Collaboratively choose a restaurant with your friends"),
    ).toBeVisible();

    // The excuse quote rotates on an interval; capture it, then assert it changes.
    const quote = page.locator("p.italic");
    const firstExcuse = await quote.textContent();
    await expect
      .poll(async () => quote.textContent(), { timeout: 6_000 })
      .not.toBe(firstExcuse);
  });

  test("the CTA points to the start flow", async ({ page }) => {
    await page.goto("/");

    // We assert the funnel wiring rather than navigating: /start mounts the
    // InstantDB client and requires a live backend (it can't render against a
    // placeholder app). The seeded, backend-backed flow lives in voting.spec.ts.
    const cta = page.getByRole("link", { name: /find a restaurant/i });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/start");
  });
});

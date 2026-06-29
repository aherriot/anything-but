import { test, expect } from "@playwright/test";

/**
 * The marquee flow: two guests narrow restaurants down to a single agreed pick.
 *
 * This needs a *seeded* InstantDB test app, because the collaborative state lives
 * in InstantDB (synced over websockets, not the /api routes — so it can't be
 * faked with request interception). To run it, set these env vars to a throwaway
 * test app and seed it in a global setup via @instantdb/admin:
 *
 *   E2E_INSTANT_APP_ID       - a test InstantDB app id
 *   E2E_INSTANT_ADMIN_TOKEN  - its admin token
 *
 * The body below is the intended script; it's gated so CI stays green until those
 * credentials exist. Replace the seeding/selectors with the real ones when wiring
 * it up.
 */
const hasTestApp = Boolean(
  process.env.E2E_INSTANT_APP_ID && process.env.E2E_INSTANT_ADMIN_TOKEN,
);

test.describe("collaborative voting", () => {
  test.skip(
    !hasTestApp,
    "needs a seeded InstantDB test app (set E2E_INSTANT_APP_ID / E2E_INSTANT_ADMIN_TOKEN)",
  );

  test("two guests veto down to a single agreed restaurant", async ({
    browser,
  }) => {
    // 1. Seed a group with a known set of cachedRestaurants + two guests via
    //    @instantdb/admin (in a global-setup, so the group id is available here).
    const groupId = process.env.E2E_SEEDED_GROUP_ID!;

    // 2. Open the group as two independent guests.
    const guestA = await (await browser.newContext()).newPage();
    const guestB = await (await browser.newContext()).newPage();
    await guestA.goto(`/groups/${groupId}`);
    await guestB.goto(`/groups/${groupId}`);

    // 3. Both guests veto every option except the agreed one, then vote it "yes".
    //    Each veto should sync to the other guest in real time.
    //    (Drive the vote buttons rendered by RestaurantSwipe's SwipeView.)

    // 4. Both land on the consensus view for the same restaurant.
    await expect(guestA.getByText("Everyone agrees!")).toBeVisible();
    await expect(guestB.getByText("Everyone agrees!")).toBeVisible();
  });
});

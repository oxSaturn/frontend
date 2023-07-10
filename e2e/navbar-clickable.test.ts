import { test, expect } from "@playwright/test";
const swap = "http://localhost:3000/swap";

// in case we have regression when refactor, like navbar gets hidden due to negative z-index
test("Liquidity link should be clickable", async ({ page }) => {
  await page.goto(swap);

  // Click the Liquidity link.
  await page.getByRole("link", { name: "Liquidity" }).click();

  // Expects the URL to contain liquidity.
  await expect(page).toHaveURL(/.*liquidity/);
});

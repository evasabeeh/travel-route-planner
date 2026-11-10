import { expect, test, type Page } from "@playwright/test";

const locations = [
  { country: "France", capital: "Paris", latitude: 48.8333, longitude: 2.3333 },
  { country: "Germany", capital: "Berlin", latitude: 52.5, longitude: 13.4167 },
];

const itinerary = {
  origin: "France",
  destination: "Germany",
  totalCost: 765,
  totalDuration: 2.92,
  transfers: 1,
  segments: [{
    origin: locations[0],
    destination: locations[1],
    transport: "plane",
    cost: 765,
    duration: 2.92,
  }],
};

async function mockApi(page: Page) {
  await page.route("**/locations", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ locations }),
  }));
  await page.route("**/routes/search", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(itinerary),
  }));
}

test("completes a keyboard-accessible search workflow", async ({ page }) => {
  await mockApi(page);
  await page.goto("/planner");

  const origin = page.getByRole("combobox").nth(0);
  await origin.click();
  await expect(page.getByRole("option", { name: /France Paris/i })).toBeVisible();
  await origin.press("ArrowDown");
  await page.getByRole("option").first().press("Enter");

  const destination = page.getByRole("combobox").nth(1);
  await destination.click();
  await destination.press("ArrowDown");
  await page.getByRole("option").first().press("Enter");
  await page.getByRole("radio", { name: "Best value" }).check();
  await page.getByRole("button", { name: /Search routes/i }).click();

  await expect(page).toHaveURL(/\/results$/);
  await expect(page.getByRole("heading", { name: "Recommended itinerary" })).toBeVisible();
  await expect(page.getByLabel(/Map showing the route/)).toBeVisible();
});

test("keeps the form usable on mobile", async ({ page }) => {
  await mockApi(page);
  await page.goto("/planner");

  await expect(page.getByRole("region", { name: "Route search" })).toBeVisible();
  await expect(page.getByRole("combobox").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Search routes/i })).toBeVisible();
});

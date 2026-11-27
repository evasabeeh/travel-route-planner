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

async function expectNoHorizontalOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(widths.documentWidth).toBeLessThanOrEqual(widths.viewportWidth);
}

test("completes a keyboard-accessible search workflow", async ({ page }) => {
  await mockApi(page);
  await page.goto("/planner");

  const origin = page.getByRole("combobox").nth(0);
  await origin.click();
  await expect(page.getByRole("option", { name: /France Paris/i })).toBeVisible();
  await origin.press("ArrowDown");
  await origin.press("Enter");

  const destination = page.getByRole("combobox").nth(1);
  await destination.fill("Germany");
  await expect(page.getByRole("listbox", { name: "To country suggestions" }).getByRole("option", { name: /Germany Berlin/i })).toBeVisible();
  await destination.press("ArrowDown");
  await destination.press("Enter");
  await page.getByRole("radio", { name: "Best value" }).check();
  await page.getByRole("button", { name: /Search routes/i }).click();

  await expect(page).toHaveURL(/\/results\?origin=France&destination=Germany&preference=cheapest&maximumTransfers=3$/);
  await expect(page.getByRole("heading", { name: "Recommended itinerary" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Route map" })).toBeVisible();
  await expect(page.getByText(/Stops in order: Paris, France to Berlin, Germany/)).toBeAttached();
});

test("opens a shared route link and prefills the search form", async ({ page }) => {
  await mockApi(page);
  await page.goto("/results?origin=France&destination=Germany&preference=cheapest&transport=bus&maximumTransfers=1");

  await expect(page.getByRole("heading", { name: "Recommended itinerary" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByRole("link", { name: "Adjust search" }).click();

  await expect(page.getByRole("combobox", { name: "From" })).toHaveValue("France");
  await expect(page.getByRole("combobox", { name: "To" })).toHaveValue("Germany");
  await expect(page.getByRole("radio", { name: "Best value" })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Buses" })).toBeChecked();
  await expect(page.getByLabel("Max transfers")).toHaveValue("1");
});

test("keeps the form usable on mobile", async ({ page }) => {
  await mockApi(page);
  await page.goto("/planner");

  await expect(page.getByRole("region", { name: "Route search" })).toBeVisible();
  await expect(page.getByRole("combobox").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Search routes/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

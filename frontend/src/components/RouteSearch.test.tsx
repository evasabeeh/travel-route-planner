import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getLocations, parsePreferences } from "../api";
import { RouteSearch } from "./RouteSearch";

vi.mock("../api", () => ({
  getLocations: vi.fn(),
  searchRoutes: vi.fn(),
  parsePreferences: vi.fn(),
}));

const locations = [
  { country: "France", capital: "Paris", latitude: 48.8, longitude: 2.3 },
  { country: "Germany", capital: "Berlin", latitude: 52.5, longitude: 13.4 },
];

function renderSearch() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <RouteSearch onSubmitted={vi.fn()} />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("RouteSearch", () => {
  beforeEach(() => {
    vi.mocked(getLocations).mockResolvedValue(locations);
  });

  it("opens the country list on the first click and supports keyboard selection", async () => {
    const user = userEvent.setup();
    renderSearch();
    const origin = screen.getAllByRole("combobox")[0];

    await user.click(origin);
    expect(await screen.findAllByRole("option")).not.toHaveLength(0);
    await user.keyboard("{ArrowDown}{Enter}");

    expect(origin).toHaveValue("France");
  });

  it("shows validation errors when submitted without locations", async () => {
    const user = userEvent.setup();
    renderSearch();
    await user.click(screen.getByRole("button", { name: /Search routes/i }));

    expect(await screen.findByText("Choose an origin")).toBeVisible();
    expect(screen.getByText("Choose a destination")).toBeVisible();
  });

  it("shows an API loading error", async () => {
    vi.mocked(getLocations).mockRejectedValueOnce(new Error("offline"));
    renderSearch();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Connect the routing API");
    });
  });

  it("allows switching between fastest and best value", async () => {
    const user = userEvent.setup();
    renderSearch();
    const cheapest = screen.getByRole("radio", { name: "Best value" });

    await user.click(cheapest);

    expect(cheapest).toBeChecked();
    expect(screen.getByRole("radio", { name: "Fastest" })).not.toBeChecked();
  });

  it("uses AI preferences without submitting a route automatically", async () => {
    vi.mocked(parsePreferences).mockResolvedValue({
      origin: "France",
      destination: "Germany",
      preference: "cheapest",
      transportTypes: ["train"],
      maximumTransfers: 2,
    });
    const user = userEvent.setup();
    renderSearch();
    await user.type(screen.getByPlaceholderText(/Cheapest route/i), "Cheapest France to Germany");
    await user.click(screen.getByRole("button", { name: "Use AI" }));

    expect(await screen.findByText(/Preferences extracted/i)).toBeVisible();
    expect(screen.getAllByRole("combobox")[0]).toHaveValue("France");
    expect(screen.getAllByRole("combobox")[1]).toHaveValue("Germany");
    expect(screen.getByRole("radio", { name: "Best value" })).toBeChecked();
  });
});

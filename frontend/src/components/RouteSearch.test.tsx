import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
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

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}

function renderSearch(initialEntry = "/planner") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <QueryClientProvider client={queryClient}>
        <RouteSearch />
        <LocationProbe />
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
    const origin = screen.getByRole("combobox", { name: "From" });

    await user.click(origin);
    expect(await screen.findAllByRole("option")).not.toHaveLength(0);
    expect(origin).toHaveAttribute("aria-autocomplete", "list");
    expect(origin).toHaveAttribute("aria-controls");
    await user.keyboard("{ArrowDown}{Enter}");

    expect(origin).toHaveValue("France");
  });

  it("supports Home and End navigation and restores focus after selection", async () => {
    const user = userEvent.setup();
    renderSearch();
    const origin = screen.getByRole("combobox", { name: "From" });

    await user.click(origin);
    await user.keyboard("{End}{Enter}");
    expect(origin).toHaveValue("Germany");
    expect(origin).toHaveFocus();

    await user.click(origin);
    await user.clear(origin);
    await user.keyboard("{Home}{Enter}");
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
    expect(screen.getByRole("combobox", { name: "From" })).toHaveValue("France");
    expect(screen.getByRole("combobox", { name: "To" })).toHaveValue("Germany");
    expect(screen.getByRole("radio", { name: "Best value" })).toBeChecked();
  });

  it("prefills the search form from a shared route URL", () => {
    renderSearch("/planner?origin=France&destination=Germany&preference=cheapest&transport=bus&maximumTransfers=1");

    expect(screen.getByRole("combobox", { name: "From" })).toHaveValue("France");
    expect(screen.getByRole("combobox", { name: "To" })).toHaveValue("Germany");
    expect(screen.getByRole("radio", { name: "Best value" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Buses" })).toBeChecked();
    expect(screen.getByLabelText("Max transfers")).toHaveValue(1);
  });

  it("navigates to a shareable results URL containing search filters", async () => {
    const user = userEvent.setup();
    renderSearch();
    const origin = screen.getByRole("combobox", { name: "From" });
    const destination = screen.getByRole("combobox", { name: "To" });

    await user.type(origin, "France");
    await user.keyboard("{ArrowDown}{Enter}");
    await user.type(destination, "Germany");
    await user.keyboard("{ArrowDown}{Enter}");
    await user.click(screen.getByRole("radio", { name: "Best value" }));
    await user.click(screen.getByRole("checkbox", { name: "Buses" }));
    await user.clear(screen.getByLabelText("Max transfers"));
    await user.type(screen.getByLabelText("Max transfers"), "1");
    await user.click(screen.getByRole("button", { name: /Search routes/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/results?");
    });
    const search = screen.getByTestId("location").textContent?.split("?")[1] ?? "";
    const params = new URLSearchParams(search);
    expect(params.get("origin")).toBe("France");
    expect(params.get("destination")).toBe("Germany");
    expect(params.get("preference")).toBe("cheapest");
    expect(params.getAll("transport")).toEqual(["bus"]);
    expect(params.get("maximumTransfers")).toBe("1");
  });
});

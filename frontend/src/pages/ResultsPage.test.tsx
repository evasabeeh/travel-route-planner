import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { explainRoute, searchRoutes } from "../api";
import type { Itinerary } from "../types";
import { ResultsPage } from "./ResultsPage";

vi.mock("../api", () => ({
  searchRoutes: vi.fn(),
  explainRoute: vi.fn(),
}));

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="route-map">{children}</div>,
  TileLayer: () => null,
  Polyline: () => <div data-testid="route-line" />,
  CircleMarker: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  useMap: () => ({ fitBounds: vi.fn(), setView: vi.fn() }),
}));

const itinerary: Itinerary = {
  origin: "France",
  destination: "Germany",
  totalCost: 765,
  totalDuration: 2.92,
  transfers: 1,
  segments: [{
    origin: { country: "France", capital: "Paris", latitude: 48.8, longitude: 2.3 },
    destination: { country: "Germany", capital: "Berlin", latitude: 52.5, longitude: 13.4 },
    transport: "plane",
    cost: 765,
    duration: 2.92,
  }],
};

function renderResults(initialEntry = "/results?origin=France&destination=Germany&preference=fastest&maximumTransfers=3") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <QueryClientProvider client={queryClient}>
        <ResultsPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("ResultsPage", () => {
  let originalClipboard: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    vi.mocked(searchRoutes).mockResolvedValue(itinerary);
    vi.mocked(explainRoute).mockResolvedValue({ explanation: "This route is calculated by the planner." });
  });

  afterEach(() => {
    if (originalClipboard) {
      Object.defineProperty(navigator, "clipboard", originalClipboard);
    } else {
      Reflect.deleteProperty(navigator, "clipboard");
    }
  });

  it("renders route details and the interactive map boundary", async () => {
    renderResults();

    expect(await screen.findByText("Recommended itinerary")).toBeVisible();
    expect(screen.getByTestId("route-map")).toBeVisible();
    expect(screen.getByTestId("route-line")).toBeVisible();
    expect(screen.getByText(/Stops in order: Paris, France to Berlin, Germany/)).toBeInTheDocument();
    expect(screen.getAllByText("₹64,260").length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole("button", { name: "Explain this route" }));
    expect(await screen.findByText(/calculated by the planner/i)).toBeVisible();
  });

  it("renders a clear no-route error", async () => {
    vi.mocked(searchRoutes).mockRejectedValueOnce(new Error("No route available"));
    renderResults();

    await waitFor(() => {
      expect(screen.getByText(/We couldn’t load this route/i)).toBeVisible();
    });
  });

  it("uses search details from the URL for direct links", async () => {
    renderResults("/results?origin=France&destination=Germany&preference=cheapest&transport=plane&transport=train&maximumTransfers=2");

    await screen.findByText("Recommended itinerary");
    expect(screen.getByText("Best value")).toBeVisible();
    expect(screen.getByText("Flight")).toBeVisible();
    expect(screen.getByText("Train")).toBeVisible();
    expect(screen.getByText("Max 2 transfers")).toBeVisible();
    expect(vi.mocked(searchRoutes).mock.calls[0][0]).toEqual({
      origin: "France",
      destination: "Germany",
      preference: "cheapest",
      transportTypes: ["plane", "train"],
      maximumTransfers: 2,
    });
  });

  it("copies a shareable URL and announces success", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    renderResults();

    await user.click(await screen.findByRole("button", { name: "Copy route link" }));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining(
      "/results?origin=France&destination=Germany&preference=fastest&maximumTransfers=3",
    ));
    expect(await screen.findByRole("status")).toHaveTextContent("Route link copied to clipboard.");
  });

  it("explains alternate-route cost, duration, and transfer trade-offs", async () => {
    vi.mocked(searchRoutes)
      .mockResolvedValueOnce(itinerary)
      .mockResolvedValueOnce({
        ...itinerary,
        totalCost: 700,
        totalDuration: 4.25,
        transfers: 2,
      });
    renderResults();

    expect(await screen.findByText(/Compared with the recommended route:/)).toHaveTextContent(
      "Saves ₹5,460 · 1.3h slower · 1 more transfer.",
    );
  });

  it("shows a clear empty state for incomplete route URLs", () => {
    renderResults("/results?origin=France");

    expect(screen.getByRole("heading", { name: "This route link is incomplete." })).toBeVisible();
    expect(screen.getByRole("link", { name: "Back to search" })).toHaveAttribute("href", "/planner");
    expect(searchRoutes).not.toHaveBeenCalled();
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { searchRoutes } from "../api";
import type { Itinerary } from "../types";
import { ResultsPage } from "./ResultsPage";

vi.mock("../api", () => ({
  searchRoutes: vi.fn(),
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

function renderResults() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ResultsPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("ResultsPage", () => {
  beforeEach(() => {
    sessionStorage.setItem("wayfinder-search", JSON.stringify({
      origin: "France",
      destination: "Germany",
      preference: "fastest",
      transportTypes: [],
      maximumTransfers: 3,
    }));
    vi.mocked(searchRoutes).mockResolvedValue(itinerary);
  });

  it("renders route details and the interactive map boundary", async () => {
    renderResults();

    expect(await screen.findByText("Recommended itinerary")).toBeVisible();
    expect(screen.getByTestId("route-map")).toBeVisible();
    expect(screen.getByTestId("route-line")).toBeVisible();
    expect(screen.getAllByText("$765").length).toBeGreaterThan(0);
  });

  it("renders a clear no-route error", async () => {
    vi.mocked(searchRoutes).mockRejectedValueOnce(new Error("No route available"));
    renderResults();

    await waitFor(() => {
      expect(screen.getByText(/We couldn’t find a route/i)).toBeVisible();
    });
  });
});

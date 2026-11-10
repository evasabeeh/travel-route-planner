import type { ApiError, Itinerary, Location, SearchRequest } from "./types";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body) headers.set("Content-Type", "application/json");
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  });
  const payload = (await response.json()) as T | ApiError;
  if (!response.ok) {
    const error = payload as ApiError;
    throw new Error(error.error?.message ?? "The API request failed.");
  }
  return payload as T;
}

export async function getLocations(): Promise<Location[]> {
  const response = await request<{ locations: Location[] }>("/locations");
  return response.locations;
}

export async function searchRoutes(input: SearchRequest): Promise<Itinerary> {
  return request<Itinerary>("/routes/search", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

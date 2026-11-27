import type { RoutePreference, SearchRequest, TransportType } from "./types";

const defaultMaximumTransfers = 3;

function isAvailableTransportType(type: string): type is TransportType {
  return type === "plane" || type === "train" || type === "bus";
}

export function parseRouteSearchParams(params: URLSearchParams): SearchRequest | null {
  const origin = params.get("origin")?.trim() ?? "";
  const destination = params.get("destination")?.trim() ?? "";
  if (!origin || !destination) return null;

  const preference: RoutePreference = params.get("preference") === "cheapest"
    ? "cheapest"
    : "fastest";
  const maximumTransfersValue = params.get("maximumTransfers");
  const requestedMaximumTransfers = maximumTransfersValue === null ||
    !/^\d+$/.test(maximumTransfersValue)
    ? Number.NaN
    : Number(maximumTransfersValue);
  const maximumTransfers = Number.isInteger(requestedMaximumTransfers) &&
    requestedMaximumTransfers >= 0 &&
    requestedMaximumTransfers <= 10
    ? requestedMaximumTransfers
    : defaultMaximumTransfers;
  const transportTypes = [...new Set(
    params.getAll("transport").filter(isAvailableTransportType),
  )];

  return { origin, destination, preference, transportTypes, maximumTransfers };
}

export function createRouteSearchParams(request: SearchRequest): URLSearchParams {
  const params = new URLSearchParams();
  params.set("origin", request.origin);
  params.set("destination", request.destination);
  params.set("preference", request.preference);
  for (const transport of request.transportTypes) {
    if (isAvailableTransportType(transport)) {
      params.append("transport", transport);
    }
  }
  if (request.maximumTransfers !== undefined) {
    params.set("maximumTransfers", String(request.maximumTransfers));
  }
  return params;
}

export function routeSearchHref(pathname: string, request: SearchRequest): string {
  return `${pathname}?${createRouteSearchParams(request).toString()}`;
}

export function getRouteSearchDefaults(params: URLSearchParams): SearchRequest {
  return parseRouteSearchParams(params) ?? {
    origin: "",
    destination: "",
    preference: "fastest",
    transportTypes: [],
    maximumTransfers: defaultMaximumTransfers,
  };
}

export type TransportType = "plane" | "train" | "bus" | "other";
export type RoutePreference = "fastest" | "cheapest";

export interface Location {
  country: string;
  capital: string;
  latitude: number;
  longitude: number;
}

export interface RouteSegment {
  origin: Location;
  destination: Location;
  transport: TransportType;
  cost: number;
  duration: number;
  note?: string;
}

export interface Itinerary {
  origin: string;
  destination: string;
  totalCost: number;
  totalDuration: number;
  transfers: number;
  segments: RouteSegment[];
}

export interface SearchRequest {
  origin: string;
  destination: string;
  preference: RoutePreference;
  transportTypes: TransportType[];
  maximumTransfers?: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export interface AiPreferences {
  origin: string;
  destination: string;
  preference: RoutePreference;
  transportTypes: TransportType[];
  maximumTransfers?: number;
}

export interface AiExplanation {
  explanation: string;
}

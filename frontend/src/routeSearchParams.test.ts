import { describe, expect, it } from "vitest";
import { createRouteSearchParams, parseRouteSearchParams, routeSearchHref } from "./routeSearchParams";
import type { SearchRequest } from "./types";

describe("route search URL parameters", () => {
  it("round-trips route details and repeated transport filters", () => {
    const request: SearchRequest = {
      origin: "Côte d'Ivoire",
      destination: "United States",
      preference: "cheapest",
      transportTypes: ["train", "bus"],
      maximumTransfers: 2,
    };

    const href = routeSearchHref("/results", request);
    const [, search = ""] = href.split("?");

    expect(parseRouteSearchParams(new URLSearchParams(search))).toEqual(request);
    expect(href).toContain("transport=train&transport=bus");
  });

  it("rejects links without both endpoints", () => {
    expect(parseRouteSearchParams(new URLSearchParams("origin=France"))).toBeNull();
    expect(parseRouteSearchParams(new URLSearchParams("destination=Germany"))).toBeNull();
  });

  it("uses safe defaults and ignores unsupported or duplicate filters", () => {
    const params = new URLSearchParams(
      "origin=France&destination=Germany&preference=unknown&transport=plane&transport=plane&transport=other&maximumTransfers=99",
    );

    expect(parseRouteSearchParams(params)).toEqual({
      origin: "France",
      destination: "Germany",
      preference: "fastest",
      transportTypes: ["plane"],
      maximumTransfers: 3,
    });
  });

  it("serializes special characters without losing spaces", () => {
    const params = createRouteSearchParams({
      origin: "United States",
      destination: "Côte d'Ivoire",
      preference: "fastest",
      transportTypes: [],
      maximumTransfers: 0,
    });

    expect(parseRouteSearchParams(params)).toEqual({
      origin: "United States",
      destination: "Côte d'Ivoire",
      preference: "fastest",
      transportTypes: [],
      maximumTransfers: 0,
    });
  });
});

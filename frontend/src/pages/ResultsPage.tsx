import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { explainRoute, searchRoutes } from "../api";
import { parseRouteSearchParams } from "../routeSearchParams";
import type { SearchRequest } from "../types";
import { AiExplanationCard, ErrorState, ItineraryCard, LoadingState, RouteComparison, RouteCriteria, RouteMap, RouteSummary } from "./ResultsComponents";

export function ResultsPage() {
  const location = useLocation();
  const request = parseRouteSearchParams(new URLSearchParams(location.search));
  const [shareStatus, setShareStatus] = useState("");

  const copyRouteLink = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard access is unavailable.");
      await navigator.clipboard.writeText(
        `${window.location.origin}${location.pathname}${location.search}`,
      );
      setShareStatus("Route link copied to clipboard.");
    } catch {
      setShareStatus("Could not copy the link. Copy it from your address bar.");
    }
  };

  const { data, isLoading, isError, error, refetch: refetchPrimary } = useQuery({
    queryKey: ["route", request],
    queryFn: ({ signal }) => {
      if (!request) throw new Error("Route parameters are missing.");
      return searchRoutes(request, signal);
    },
    enabled: Boolean(request),
  });
  const alternateRequest: SearchRequest | null = request
    ? {
      ...request,
      preference: request.preference === "fastest" ? "cheapest" : "fastest",
    }
    : null;
  const {
    data: alternate,
    isFetching: isAlternateLoading,
    isError: isAlternateError,
    error: alternateError,
    refetch: refetchAlternate,
  } = useQuery({
    queryKey: ["route-alternate", alternateRequest],
    queryFn: ({ signal }) => {
      if (!alternateRequest) throw new Error("Route parameters are missing.");
      return searchRoutes(alternateRequest, signal);
    },
    enabled: Boolean(data && alternateRequest),
  });
  const [explanationRequested, setExplanationRequested] = useState(false);
  const {
    data: explanation,
    isFetching: isExplanationLoading,
    isError: isExplanationError,
    error: explanationError,
    refetch: refetchExplanation,
  } = useQuery({
    queryKey: ["route-explanation", data],
    queryFn: ({ signal }) => explainRoute(data!, signal),
    enabled: Boolean(data && explanationRequested),
    retry: false,
  });

  if (!request) {
    return (
      <main className="mx-auto mt-24 max-w-7xl px-6 text-center max-sm:mt-12">
        <h1 className="font-display text-2xl font-semibold">This route link is incomplete.</h1>
        <p className="mt-3 text-sm text-slate">Add an origin and destination to search for a route.</p>
        <Link className="mt-5 inline-flex rounded-2xl bg-navy px-5 py-3.5 font-bold text-white no-underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-coral/40" to="/planner">Back to search</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[118rem] px-[2.8rem] py-28 max-sm:px-4 max-sm:py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <p className="mb-4 text-xs font-bold tracking-[.14em] text-muted">YOUR ROUTE</p>
          <h1 className="break-words font-display text-[clamp(2rem,4vw,3.8rem)] font-bold tracking-[-.07em]">
            {request.origin} <span className="text-coral" aria-hidden="true">→</span> {request.destination}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 max-sm:w-full">
          <button type="button" className="rounded-2xl border border-border-soft bg-white px-4 py-3 text-sm font-bold text-slate hover:border-coral focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-coral/40 max-sm:flex-1" onClick={copyRouteLink}>
            Copy route link
          </button>
        </div>
      </div>
      <RouteCriteria request={request} />
      {shareStatus && <p className="mb-4 text-sm text-green" role="status" aria-live="polite">{shareStatus}</p>}
      {isLoading && <LoadingState />}
      {isError && <ErrorState message={error instanceof Error ? error.message : "API unavailable. Check that the routing API is running, then retry."} />}
      {isError && <button type="button" className="mt-4 rounded-2xl bg-navy px-5 py-3.5 font-bold text-white focus-visible:ring-4 focus-visible:ring-coral/40" onClick={() => refetchPrimary()}>Retry route search</button>}
      {data && alternateRequest && <div className="grid grid-cols-[1.1fr_.9fr] gap-[2.2rem] max-md:grid-cols-1">
        <section aria-label="Itinerary details">
          <RouteSummary itinerary={data} />
          <ItineraryCard itinerary={data} />
          <AiExplanationCard
            explanation={explanation?.explanation}
            isLoading={isExplanationLoading}
            error={isExplanationError ? (explanationError instanceof Error ? explanationError.message : "AI explanation is unavailable.") : undefined}
            onExplain={() => setExplanationRequested(true)}
            onRetry={() => refetchExplanation()}
          />
        </section>
        <aside aria-label="Route map and comparison">
          <RouteMap itinerary={data} />
          <RouteComparison itinerary={alternate} primary={data} request={request} alternatePreference={alternateRequest.preference} isLoading={isAlternateLoading} error={isAlternateError ? (alternateError instanceof Error ? alternateError.message : "The alternate route is unavailable.") : undefined} onRetry={() => refetchAlternate()} />
        </aside>
      </div>}
    </main>
  );
}

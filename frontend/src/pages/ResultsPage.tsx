import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { explainRoute, searchRoutes } from "../api";
import type { SearchRequest } from "../types";
import { AiExplanationCard, ErrorState, ItineraryCard, LoadingState, RouteComparison, RouteMap, RouteSummary } from "./ResultsComponents";

export function ResultsPage() {
  const request = JSON.parse(sessionStorage.getItem("wayfinder-search") ?? "{}") as SearchRequest;
  const { data, isLoading, isError, error, refetch: refetchPrimary } = useQuery({
    queryKey: ["route", request],
    queryFn: ({ signal }) => searchRoutes(request, signal),
    enabled: Boolean(request.origin && request.destination),
  });
  const alternateRequest = {
    ...request,
    preference: request.preference === "fastest" ? "cheapest" as const : "fastest" as const,
  };
  const {
    data: alternate,
    isFetching: isAlternateLoading,
    isError: isAlternateError,
    error: alternateError,
    refetch: refetchAlternate,
  } = useQuery({
    queryKey: ["route-alternate", alternateRequest],
    queryFn: ({ signal }) => searchRoutes(alternateRequest, signal),
    enabled: Boolean(data),
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

  if (!request.origin) {
    return <main className="mx-auto mt-24 max-w-7xl text-center"><h1 className="font-display">Start with a route search.</h1><Link className="mt-4 inline-flex rounded-2xl bg-navy px-5 py-3.5 font-bold text-white no-underline" to="/planner">Back to search</Link></main>;
  }
  return (
    <main className="mx-auto max-w-[118rem] px-[2.8rem] py-28">
      <div className="mb-8 flex items-end justify-between max-sm:block"><div><p className="mb-4 text-xs font-bold tracking-[.14em] text-muted">YOUR ROUTE</p><h1 className="font-display text-[clamp(2rem,4vw,3.8rem)] font-bold tracking-[-.07em]">{request.origin} <span className="text-coral">→</span> {request.destination}</h1></div><Link to="/planner" className="text-sm text-slate no-underline max-sm:mt-4 max-sm:block">← New search</Link></div>
      {isLoading && <LoadingState />}
      {isError && <ErrorState message={error instanceof Error ? error.message : "API unavailable. Check that the routing API is running, then retry."} />}
      {isError && <button type="button" className="mt-4 rounded-2xl bg-navy px-5 py-3.5 font-bold text-white focus-visible:ring-4 focus-visible:ring-coral/40" onClick={() => refetchPrimary()}>Retry route search</button>}
      {data && <div className="grid grid-cols-[1.1fr_.9fr] gap-[2.2rem] max-md:grid-cols-1"><section><RouteSummary itinerary={data} /><ItineraryCard itinerary={data} /><AiExplanationCard explanation={explanation?.explanation} isLoading={isExplanationLoading} error={isExplanationError ? (explanationError instanceof Error ? explanationError.message : "AI explanation is unavailable.") : undefined} onExplain={() => setExplanationRequested(true)} onRetry={() => refetchExplanation()} /></section><aside><RouteMap itinerary={data} /><RouteComparison itinerary={alternate} request={alternateRequest} isLoading={isAlternateLoading} error={isAlternateError ? (alternateError instanceof Error ? alternateError.message : "The alternate route is unavailable.") : undefined} onRetry={() => refetchAlternate()} /></aside></div>}
    </main>
  );
}

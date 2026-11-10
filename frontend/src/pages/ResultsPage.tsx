import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import { explainRoute, searchRoutes } from "../api";
import { formatRouteCost } from "../currency";
import type { Itinerary, RouteSegment, SearchRequest } from "../types";

const icons = { plane: "✈", train: "▣", bus: "▰", other: "•" };

function RouteMap({ itinerary }: { itinerary: Itinerary }) {
  const points = itinerary.segments.flatMap((segment, index) => index === 0 ? [segment.origin, segment.destination] : [segment.destination]);
  const positions = points.map((point) => [point.latitude, point.longitude] as LatLngExpression);
  const bounds = positions as LatLngBoundsExpression;

  function FitRouteBounds() {
    const map = useMap();
    useEffect(() => {
      if (positions.length > 1) {
        map.fitBounds(bounds, { padding: [36, 36], maxZoom: 5 });
      } else {
        map.setView(positions[0], 4);
      }
    }, [map]);
    return null;
  }

  return (
    <div className="relative h-144 overflow-hidden rounded-4xl border border-panel-border bg-panel max-sm:h-72" aria-label={`Map showing the route from ${itinerary.origin} to ${itinerary.destination}`}>
      <MapContainer className="h-full w-full" center={positions[0]} zoom={3} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitRouteBounds />
        <Polyline positions={positions} pathOptions={{ color: "var(--color-coral)", weight: 5, opacity: 0.9 }} />
        {points.map((point, index) => (
          <CircleMarker
            key={`${point.country}-${index}`}
            center={[point.latitude, point.longitude]}
            radius={8}
            pathOptions={{ color: "var(--color-coral)", weight: 3, fillColor: "var(--color-white)", fillOpacity: 1 }}
          >
            <Tooltip direction="top" offset={[0, -8]} permanent>
              {point.capital}
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

function Segment({ segment }: { segment: RouteSegment }) {
  return <div className="flex items-center gap-6 border-t border-border-faint py-[1.9rem] first:mt-[2.2rem]"><div className="grid size-[3.7rem] place-items-center rounded-2xl bg-coral-pale text-coral">{icons[segment.transport]}</div><div className="flex flex-1 flex-col gap-1.5"><strong className="text-[.92rem]">{segment.origin.country} <span className="mx-1.5 text-border-blue">→</span> {segment.destination.country}</strong><span className="text-xs capitalize text-muted-light">{segment.transport} · {segment.duration}h</span></div><strong className="text-sm">{formatRouteCost(segment.cost)}</strong></div>;
}

export function ResultsPage() {
  const request = JSON.parse(sessionStorage.getItem("wayfinder-search") ?? "{}") as SearchRequest;
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["route", request],
    queryFn: () => searchRoutes(request),
    enabled: Boolean(request.origin && request.destination),
  });
  const alternateRequest = {
    ...request,
    preference: request.preference === "fastest" ? "cheapest" as const : "fastest" as const,
  };
  const { data: alternate } = useQuery({
    queryKey: ["route-alternate", alternateRequest],
    queryFn: () => searchRoutes(alternateRequest),
    enabled: Boolean(request.origin && request.destination),
  });
  const { data: explanation } = useQuery({
    queryKey: ["route-explanation", data],
    queryFn: () => explainRoute(data!),
    enabled: Boolean(data),
    retry: false,
  });

  if (!request.origin) return <main className="mx-auto mt-24 max-w-7xl text-center"><h1 className="font-display">Start with a route search.</h1><Link className="mt-4 inline-flex rounded-2xl bg-navy px-5 py-3.5 font-bold text-white no-underline" to="/planner">Back to search</Link></main>;
  return <main className="mx-auto max-w-[118rem] px-[2.8rem] py-28"><div className="mb-8 flex items-end justify-between max-sm:block"><div><p className="mb-4 text-xs font-bold tracking-[.14em] text-muted">YOUR ROUTE</p><h1 className="font-display text-[clamp(2rem,4vw,3.8rem)] font-bold tracking-[-.07em]">{request.origin} <span className="text-coral">→</span> {request.destination}</h1></div><Link to="/planner" className="text-sm text-slate no-underline max-sm:mt-4 max-sm:block">← New search</Link></div>{isLoading && <div className="rounded-4xl border border-border bg-white p-20 text-center text-slate"><span className="mr-2 inline-block size-5 animate-spin rounded-full border-[.3rem] border-border-green border-t-coral align-middle" /> Finding your best route…</div>}{isError && <div className="rounded-4xl border border-border bg-white p-20 text-center text-error">We couldn’t find a route. {error instanceof Error ? error.message : "Try another search."}</div>}{data && <div className="grid grid-cols-[1.1fr_.9fr] gap-[2.2rem] max-md:grid-cols-1"><section><div className="mb-[1.8rem] flex justify-around rounded-4xl border border-border bg-white p-[2.3rem] shadow-[0_1.4rem_4rem_var(--color-shadow)]"><div><span className="block text-xs uppercase text-muted-light">Total cost</span>  <strong className="font-display text-2xl">{formatRouteCost(data.totalCost)}</strong></div><div><span className="block text-xs uppercase text-muted-light">Duration</span><strong className="font-display text-2xl">{data.totalDuration}h</strong></div><div><span className="block text-xs uppercase text-muted-light">Transfers</span><strong className="font-display text-2xl">{data.transfers}</strong></div></div><div className="rounded-4xl border border-border bg-white p-[2.6rem] shadow-[0_1.4rem_4rem_var(--color-shadow)]"><div className="flex items-start justify-between"><h2 className="font-display text-[1.45rem] font-semibold">Recommended itinerary</h2><span className="rounded-full bg-green-soft px-2.5 py-1.5 text-xs font-bold text-green">Best match</span></div>{data.segments.map((segment, index) => <Segment key={`${segment.origin.country}-${index}`} segment={segment} />)}</div>{explanation && <div className="mt-[1.8rem] rounded-4xl border border-blue-soft/40 bg-night-soft p-6 text-blue-muted"><p className="mb-2 text-xs font-bold uppercase tracking-[.09em] text-blue-soft">AI-generated explanation</p><p className="text-sm leading-6">{explanation.explanation}</p></div>}</section><aside><RouteMap itinerary={data} /><div className="mt-[1.8rem] rounded-4xl border border-border bg-white p-6 shadow-[0_1.4rem_4rem_var(--color-shadow)]"><h2 className="font-display text-[1.5rem] font-semibold">Compare options</h2><p className="text-sm leading-6 text-muted">See how the alternate priority changes this journey.</p>{alternate && <div className="my-4 flex justify-between rounded-lg bg-green-pale p-3 text-sm"><div><span className="block text-muted-light">{alternateRequest.preference === "fastest" ? "Fastest" : "Best value"}</span>  <strong>{alternate.totalDuration}h · {formatRouteCost(alternate.totalCost)}</strong></div><span>{alternate.transfers} transfers</span></div>}<Link to="/planner" className="inline-flex rounded-2xl bg-green-pale px-5 py-3.5 font-bold text-sm text-green-dark no-underline">Adjust search</Link></div></aside></div>}</main>;
}

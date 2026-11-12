import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import { formatRouteCost } from "../currency";
import type { Itinerary, RouteSegment, SearchRequest } from "../types";

const icons = { plane: "✈", train: "▣", bus: "▰", other: "•" };

export function RouteMap({ itinerary }: { itinerary: Itinerary }) {
  const [tileError, setTileError] = useState(false);
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
    <div className="relative h-144 overflow-hidden rounded-4xl border border-panel-border bg-panel max-sm:h-72" role="group" aria-labelledby="route-map-title" aria-describedby="route-map-description">
      <h2 id="route-map-title" className="sr-only">Route map</h2>
      <p id="route-map-description" className="sr-only">Map showing the route from {itinerary.origin} to {itinerary.destination}. The itinerary details below provide a keyboard-accessible alternative.</p>
      <MapContainer className="h-full w-full" center={positions[0]} zoom={3} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{ tileerror: () => setTileError(true) }}
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
            <Tooltip direction="top" offset={[0, -8]} permanent>{point.capital}</Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
      {tileError && <p className="absolute inset-x-4 bottom-4 rounded-xl bg-white/95 p-3 text-sm text-slate shadow" role="alert">Map tiles are unavailable. Use the itinerary details for the route.</p>}
    </div>
  );
}

export function RouteSummary({ itinerary }: { itinerary: Itinerary }) {
  return (
    <div className="mb-[1.8rem] flex justify-around rounded-4xl border border-border bg-white p-[2.3rem] shadow-[0_1.4rem_4rem_var(--color-shadow)]">
      <div><span className="block text-xs uppercase text-muted">Total cost</span><strong className="font-display text-2xl">{formatRouteCost(itinerary.totalCost)}</strong></div>
      <div><span className="block text-xs uppercase text-muted">Duration</span><strong className="font-display text-2xl">{itinerary.totalDuration}h</strong></div>
      <div><span className="block text-xs uppercase text-muted">Transfers</span><strong className="font-display text-2xl">{itinerary.transfers}</strong></div>
    </div>
  );
}

function Segment({ segment }: { segment: RouteSegment }) {
  return <div className="flex items-center gap-6 border-t border-border-faint py-[1.9rem] first:mt-[2.2rem]"><div className="grid size-[3.7rem] place-items-center rounded-2xl bg-coral-pale text-coral">{icons[segment.transport]}</div><div className="flex flex-1 flex-col gap-1.5"><strong className="text-[1.5rem]">{segment.origin.country} <span className="mx-1.5 text-border-blue">→</span> {segment.destination.country}</strong><span className="text-xs capitalize text-muted-light">{segment.transport} · {segment.duration}h</span></div><strong className="text-sm">{formatRouteCost(segment.cost)}</strong></div>;
}

export function ItineraryCard({ itinerary }: { itinerary: Itinerary }) {
  return (
    <div className="rounded-4xl border border-border bg-white p-[2.6rem] shadow-[0_1.4rem_4rem_var(--color-shadow)]">
      <div className="flex items-start justify-between"><h2 className="font-display text-[1.5rem] font-semibold">Recommended itinerary</h2><span className="rounded-full bg-green-soft px-2.5 py-1.5 text-xs font-bold text-green">Best match</span></div>
      {itinerary.segments.map((segment, index) => <Segment key={`${segment.origin.country}-${index}`} segment={segment} />)}
    </div>
  );
}

export function RouteComparison({ itinerary, request, isLoading, error, onRetry }: {
  itinerary?: Itinerary;
  request: SearchRequest;
  isLoading: boolean;
  error?: string;
  onRetry: () => void;
}) {
  return (
    <div className="mt-[1.8rem] rounded-4xl border border-border bg-white p-6 shadow-[0_1.4rem_4rem_var(--color-shadow)]">
      <h2 className="font-display text-[1.5rem] font-semibold">Compare options</h2>
      <p className="text-sm leading-6 text-muted">See how the alternate priority changes this journey.</p>
      {isLoading && <p className="my-4 rounded-lg bg-green-pale p-3 text-sm text-green-dark" role="status">Finding the alternate route…</p>}
      {error && <div className="my-4 rounded-lg bg-warning-bg p-3 text-sm text-warning-text" role="alert"><p>{error}</p><button type="button" className="mt-2 rounded-lg border border-warning-text px-3 py-1.5 font-bold focus-visible:ring-4 focus-visible:ring-coral/40" onClick={onRetry}>Retry alternate route</button></div>}
      {itinerary && <div className="my-4 flex justify-between rounded-lg bg-green-pale p-3 text-sm"><div><span className="block text-muted-light">{request.preference === "fastest" ? "Fastest" : "Best value"}</span><strong>{itinerary.totalDuration}h · {formatRouteCost(itinerary.totalCost)}</strong></div><span>{itinerary.transfers} transfers</span></div>}
      <Link to="/planner" className="inline-flex rounded-2xl bg-green-pale px-5 py-3.5 font-bold text-sm text-green-dark no-underline">Adjust search</Link>
    </div>
  );
}

export function AiExplanationCard({ explanation, isLoading, error, onExplain, onRetry }: {
  explanation?: string;
  isLoading: boolean;
  error?: string;
  onExplain: () => void;
  onRetry: () => void;
}) {
  return <div className="mt-[1.8rem] rounded-4xl border border-blue-soft/40 bg-night-soft p-6 text-blue-muted">
    <p className="mb-2 text-xs font-bold uppercase tracking-[.09em] text-blue-soft">AI-generated explanation</p>
    {!explanation && !isLoading && !error && <button type="button" className="rounded-xl border border-coral-bright px-4 py-2 text-sm font-bold text-coral-bright hover:bg-coral-bright hover:text-white focus-visible:ring-4 focus-visible:ring-coral-bright/50" onClick={onExplain}>Explain this route</button>}
    {isLoading && <p role="status">Generating an explanation…</p>}
    {error && <div role="alert"><p className="text-sm">{error}</p><button type="button" className="mt-2 rounded-xl border border-coral-bright px-4 py-2 text-sm font-bold text-coral-bright focus-visible:ring-4 focus-visible:ring-coral-bright/50" onClick={onRetry}>Retry explanation</button></div>}
    {explanation && <p className="text-sm leading-6">{explanation}</p>}
  </div>;
}

export function LoadingState() {
  return <div className="rounded-4xl border border-border bg-white p-20 text-center text-slate" role="status" aria-live="polite"><span className="mr-2 inline-block size-5 animate-spin rounded-full border-[.3rem] border-border-green border-t-coral align-middle" /> Finding your best route…</div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="rounded-4xl border border-border bg-white p-20 text-center text-error" role="alert">We couldn’t find a route. {message}</div>;
}

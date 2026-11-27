import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import { formatRouteCost } from "../currency";
import { routeSearchHref } from "../routeSearchParams";
import type { Itinerary, RoutePreference, RouteSegment, SearchRequest } from "../types";

const icons = { plane: "✈", train: "▣", bus: "▰", other: "•" };

export function RouteMap({ itinerary }: { itinerary: Itinerary }) {
  const [tileError, setTileError] = useState(false);
  const points = itinerary.segments.flatMap((segment, index) => index === 0 ? [segment.origin, segment.destination] : [segment.destination]);
  if (points.length === 0) {
    return <p className="rounded-3xl border border-border bg-white p-5 text-sm text-slate" role="status">A map is unavailable for this itinerary.</p>;
  }
  const positions = points.map((point) => [point.latitude, point.longitude] as LatLngExpression);
  const bounds = positions as LatLngBoundsExpression;
  const stopDescription = points.map((point) => `${point.capital}, ${point.country}`).join(" to ");

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
      <p id="route-map-description" className="sr-only">Route from {itinerary.origin} to {itinerary.destination}. Stops in order: {stopDescription}. The step-by-step itinerary below provides the same route as text.</p>
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
    <dl className="mb-[1.8rem] grid grid-cols-3 gap-3 rounded-4xl border border-border bg-white p-[2.3rem] shadow-[0_1.4rem_4rem_var(--color-shadow)] max-sm:p-4">
      <div><dt className="text-xs uppercase text-muted">Total cost</dt><dd className="mt-1 break-words font-display text-2xl max-sm:text-lg">{formatRouteCost(itinerary.totalCost)}</dd></div>
      <div><dt className="text-xs uppercase text-muted">Duration</dt><dd className="mt-1 font-display text-2xl max-sm:text-lg">{itinerary.totalDuration}h</dd></div>
      <div><dt className="text-xs uppercase text-muted">Transfers</dt><dd className="mt-1 font-display text-2xl max-sm:text-lg">{itinerary.transfers}</dd></div>
    </dl>
  );
}

export function RouteCriteria({ request }: { request: SearchRequest }) {
  const transportLabels = {
    plane: "Flight",
    train: "Train",
    bus: "Bus",
    other: "Other",
  };
  const transportCriteria = request.transportTypes.length > 0
    ? request.transportTypes.map((transport) => transportLabels[transport])
    : ["All transport"];
  const maximumTransfers = request.maximumTransfers;

  return (
    <ul className="mb-6 flex flex-wrap gap-2" aria-label="Search criteria">
      <li className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-slate">
        {request.preference === "fastest" ? "Fastest" : "Best value"}
      </li>
      {transportCriteria.map((transport) => (
        <li key={transport} className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-slate">
          {transport}
        </li>
      ))}
      {maximumTransfers !== undefined && (
        <li className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-slate">
          Max {maximumTransfers} {maximumTransfers === 1 ? "transfer" : "transfers"}
        </li>
      )}
    </ul>
  );
}

function Segment({ segment }: { segment: RouteSegment }) {
  return <li className="flex min-w-0 items-center gap-4 border-t border-border-faint py-6 first:mt-8 max-sm:gap-3 max-sm:py-5">
    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-coral-pale text-coral" aria-hidden="true">{icons[segment.transport]}</span>
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <strong className="break-words text-base font-semibold sm:text-xl">{segment.origin.country} <span className="mx-1 text-border-blue" aria-hidden="true">→</span> {segment.destination.country}</strong>
      <span className="text-xs capitalize text-muted-light">{segment.transport} · {segment.duration}h</span>
    </div>
    <strong className="shrink-0 text-sm">{formatRouteCost(segment.cost)}</strong>
  </li>;
}

export function ItineraryCard({ itinerary }: { itinerary: Itinerary }) {
  return (
    <div className="rounded-4xl border border-border bg-white p-[2.6rem] shadow-[0_1.4rem_4rem_var(--color-shadow)] max-sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><h2 className="font-display text-[1.5rem] font-semibold">Recommended itinerary</h2><span className="rounded-full bg-green-soft px-2.5 py-1.5 text-xs font-bold text-green">Best match</span></div>
      <ol aria-label="Route segments">
        {itinerary.segments.map((segment, index) => <Segment key={`${segment.origin.country}-${index}`} segment={segment} />)}
      </ol>
    </div>
  );
}

export function RouteComparison({ itinerary, primary, request, alternatePreference, isLoading, error, onRetry }: {
  itinerary?: Itinerary;
  primary: Itinerary;
  request: SearchRequest;
  alternatePreference: RoutePreference;
  isLoading: boolean;
  error?: string;
  onRetry: () => void;
}) {
  return (
    <div className="mt-[1.8rem] rounded-4xl border border-border bg-white p-6 shadow-[0_1.4rem_4rem_var(--color-shadow)] max-sm:p-5">
      <h2 className="font-display text-[1.5rem] font-semibold">Compare options</h2>
      <p className="text-sm leading-6 text-muted">See how the alternate priority changes this journey.</p>
      {isLoading && <p className="my-4 rounded-lg bg-green-pale p-3 text-sm text-green-dark" role="status">Finding the alternate route…</p>}
      {error && <div className="my-4 rounded-lg bg-warning-bg p-3 text-sm text-warning-text" role="alert"><p>{error}</p><button type="button" className="mt-2 rounded-lg border border-warning-text px-3 py-1.5 font-bold focus-visible:ring-4 focus-visible:ring-coral/40" onClick={onRetry}>Retry alternate route</button></div>}
      {itinerary && <div className="my-4 rounded-lg bg-green-pale p-3 text-sm">
        <div className="flex justify-between gap-3">
          <div><span className="block text-muted-light">{alternatePreference === "fastest" ? "Fastest" : "Best value"}</span><strong>{itinerary.totalDuration}h · {formatRouteCost(itinerary.totalCost)}</strong></div>
          <span className="shrink-0">{itinerary.transfers} transfers</span>
        </div>
        <p className="mt-2 border-t border-green-dark/15 pt-2 text-xs font-medium text-green-dark">
          Compared with the recommended route: {getRouteTradeoffs(primary, itinerary).join(" · ")}.
        </p>
      </div>}
      <Link to={routeSearchHref("/planner", request)} className="inline-flex rounded-2xl bg-green-pale px-5 py-3.5 font-bold text-sm text-green-dark no-underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-coral/40">Adjust search</Link>
    </div>
  );
}

function getRouteTradeoffs(primary: Itinerary, alternate: Itinerary): string[] {
  const tradeoffs: string[] = [];
  const costDifference = alternate.totalCost - primary.totalCost;
  const durationDifference = alternate.totalDuration - primary.totalDuration;
  const transferDifference = alternate.transfers - primary.transfers;

  if (costDifference < 0) {
    tradeoffs.push(`Saves ${formatRouteCost(-costDifference)}`);
  } else if (costDifference > 0) {
    tradeoffs.push(`Costs ${formatRouteCost(costDifference)} more`);
  }

  if (durationDifference < 0) {
    tradeoffs.push(`${formatHours(-durationDifference)} faster`);
  } else if (durationDifference > 0) {
    tradeoffs.push(`${formatHours(durationDifference)} slower`);
  }

  if (transferDifference < 0) {
    const fewerTransfers = Math.abs(transferDifference);
    tradeoffs.push(`${fewerTransfers} fewer ${fewerTransfers === 1 ? "transfer" : "transfers"}`);
  } else if (transferDifference > 0) {
    tradeoffs.push(`${transferDifference} more ${transferDifference === 1 ? "transfer" : "transfers"}`);
  }

  return tradeoffs.length > 0 ? tradeoffs : ["Same cost, duration and transfers"];
}

function formatHours(hours: number): string {
  return `${new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(hours)}h`;
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
  return <div className="rounded-4xl border border-border bg-white p-20 text-center text-slate max-sm:p-10" role="status" aria-live="polite" aria-busy="true"><span className="mr-2 inline-block size-5 animate-spin rounded-full border-[.3rem] border-border-green border-t-coral align-middle" aria-hidden="true" /> Finding your best route…</div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="rounded-4xl border border-border bg-white p-12 text-center text-error max-sm:p-6" role="alert"><h2 className="font-display text-xl font-semibold">We couldn’t load this route.</h2><p className="mt-2 text-sm">{message}</p></div>;
}

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { searchRoutes } from "../api";
import type { Itinerary, RouteSegment, SearchRequest } from "../types";

const icons = { plane: "✈", train: "▣", bus: "▰", other: "•" };

function RouteMap({ itinerary }: { itinerary: Itinerary }) {
  const points = itinerary.segments.flatMap((segment, index) => index === 0 ? [segment.origin, segment.destination] : [segment.destination]);
  const longitudes = points.map((point) => point.longitude);
  const latitudes = points.map((point) => point.latitude);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const longitudeRange = Math.max(maxLongitude - minLongitude, 1);
  const latitudeRange = Math.max(maxLatitude - minLatitude, 1);
  const project = (point: typeof points[number]) => ({
    x: 70 + ((point.longitude - minLongitude) / longitudeRange) * 860,
    y: 430 - ((point.latitude - minLatitude) / latitudeRange) * 360,
  });
  const projectedPoints = points.map(project);
  const polyline = projectedPoints.map((point) => `${point.x},${point.y}`).join(" ");
  return (
    <div className="route-map" aria-label={`Map showing the route from ${itinerary.origin} to ${itinerary.destination}`}>
      <svg viewBox="0 0 1000 500" role="img" aria-label="Geographic route map">
        <path className="map-land" d="M0 130 Q170 55 330 130 T650 120 T1000 150 V500 H0Z" />
        <path className="map-land map-land-secondary" d="M0 310 Q180 240 350 320 T700 290 T1000 330 V500 H0Z" />
        <polyline className="map-route" points={polyline} />
        {projectedPoints.map((point, index) => (
          <g key={`${points[index].country}-${index}`}>
            <circle className="map-point" cx={point.x} cy={point.y} r="9" />
            <text className="map-point-label" x={point.x} y={point.y - 16} textAnchor="middle">
              {points[index].capital}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function Segment({ segment }: { segment: RouteSegment }) {
  return <div className="segment"><div className="segment-icon">{icons[segment.transport]}</div><div className="segment-main"><strong>{segment.origin.country} <span>→</span> {segment.destination.country}</strong><span>{segment.transport} · {segment.duration}h</span></div><strong className="segment-cost">${segment.cost.toLocaleString()}</strong></div>;
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

  if (!request.origin) return <main className="empty-page"><h1>Start with a route search.</h1><Link className="primary-button inline-button" to="/">Back to search</Link></main>;
  return <main className="results-page"><div className="results-heading"><div><p className="eyebrow">YOUR ROUTE</p><h1>{request.origin} <span>→</span> {request.destination}</h1></div><Link to="/" className="text-link">← New search</Link></div>{isLoading && <div className="state-card"><span className="spinner" /> Finding your best route…</div>}{isError && <div className="state-card error-state">We couldn’t find a route. {error instanceof Error ? error.message : "Try another search."}</div>}{data && <div className="results-layout"><section><div className="summary-card"><div><span>Total cost</span><strong>${data.totalCost.toLocaleString()}</strong></div><div><span>Duration</span><strong>{data.totalDuration}h</strong></div><div><span>Transfers</span><strong>{data.transfers}</strong></div></div><div className="itinerary-card"><div className="card-title"><h2>Recommended itinerary</h2><span className="badge">Best match</span></div>{data.segments.map((segment, index) => <Segment key={`${segment.origin.country}-${index}`} segment={segment} />)}</div></section><aside><RouteMap itinerary={data} /><div className="compare-card"><h2>Compare options</h2><p>See how the alternate priority changes this journey.</p>{alternate && <div className="comparison-row"><div><span>{alternateRequest.preference === "fastest" ? "Fastest" : "Best value"}</span><strong>{alternate.totalDuration}h · ${alternate.totalCost.toLocaleString()}</strong></div><span>{alternate.transfers} transfers</span></div>}<Link to="/" className="secondary-button">Adjust search</Link></div></aside></div>}</main>;
}

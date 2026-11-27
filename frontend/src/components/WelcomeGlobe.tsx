import Globe from "react-globe.gl";
import { useEffect, useRef } from "react";
import type { GlobeMethods } from "react-globe.gl";

const routePoints = [
  { lat: 48.8566, lng: 2.3522, label: "Paris" },
  { lat: 51.5072, lng: -0.1276, label: "London" },
  { lat: 35.6762, lng: 139.6503, label: "Tokyo" },
  { lat: -33.8688, lng: 151.2093, label: "Sydney" },
];

const routeArcs = [
  { startLat: 48.8566, startLng: 2.3522, endLat: 35.6762, endLng: 139.6503 },
  { startLat: 51.5072, startLng: -0.1276, endLat: -33.8688, endLng: 151.2093 },
  { startLat: 35.6762, startLng: 139.6503, endLat: -33.8688, endLng: 151.2093 },
];

export function WelcomeGlobe() {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);

  useEffect(() => {
    const controls = globeRef.current?.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.35;
      controls.enableZoom = false;
    }
  }, []);

  return (
    <div className="globe-drag-area relative mx-auto flex h-[min(78vw,82rem)] w-[min(78vw,82rem)] min-w-0 max-w-full items-center justify-center overflow-hidden max-sm:h-[calc(100vw-2rem)] max-sm:w-[calc(100vw-2rem)]" aria-label="Interactive world globe">
      <Globe
        ref={globeRef}
        width={typeof window === "undefined" ? 820 : window.innerWidth < 640 ? Math.min(400, window.innerWidth - 32) : 820}
        height={typeof window === "undefined" ? 820 : window.innerWidth < 640 ? Math.min(400, window.innerWidth - 32) : 820}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
        showAtmosphere
        atmosphereColor="#8fb9ff"
        atmosphereAltitude={0.14}
        pointsData={routePoints}
        pointLat="lat"
        pointLng="lng"
        pointColor={() => "#ff7658"}
        pointAltitude={0.025}
        pointRadius={0.45}
        pointLabel="label"
        arcsData={routeArcs}
        arcColor={() => ["#ff7658", "#8fb9ff"]}
        arcAltitudeAutoScale={0.55}
        arcStroke={0.35}
        arcDashLength={0.45}
        arcDashGap={1.4}
        arcDashAnimateTime={3600}
        ringsData={routePoints}
        ringColor={() => "#ff7658"}
        ringMaxRadius={1.8}
        ringPropagationSpeed={0.8}
        ringRepeatPeriod={1800}
      />
    </div>
  );
}

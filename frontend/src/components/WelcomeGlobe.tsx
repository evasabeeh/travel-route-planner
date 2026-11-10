import Globe from "react-globe.gl";
import { useEffect, useRef } from "react";
import type { GlobeMethods } from "react-globe.gl";

const routePoints = [
  { lat: 48.8566, lng: 2.3522, label: "Paris" },
  { lat: 51.5072, lng: -0.1276, label: "London" },
  { lat: 35.6762, lng: 139.6503, label: "Tokyo" },
  { lat: -33.8688, lng: 151.2093, label: "Sydney" },
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
    <div className="relative mx-auto flex h-[min(72vw,68rem)] w-[min(72vw,68rem)] min-w-0 max-w-full items-center justify-center overflow-hidden max-sm:h-[min(88vw,34rem)] max-sm:w-[min(88vw,34rem)]" aria-label="Interactive world globe">
      <Globe
        ref={globeRef}
        width={typeof window === "undefined" ? 680 : window.innerWidth < 640 ? Math.min(340, window.innerWidth * 0.72) : 680}
        height={typeof window === "undefined" ? 680 : window.innerWidth < 640 ? Math.min(340, window.innerWidth * 0.72) : 680}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
        showAtmosphere
        atmosphereColor="var(--color-blue)"
        atmosphereAltitude={0.14}
        pointsData={routePoints}
        pointLat="lat"
        pointLng="lng"
        pointColor={() => "var(--color-coral-bright)"}
        pointAltitude={0.025}
        pointRadius={0.45}
        pointLabel="label"
      />
    </div>
  );
}

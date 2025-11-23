"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

interface TrackMapProps {
  /** Array of [lat, lng] points along the track */
  points?: [number, number][];
}

// Simple vertical rail-like line; longitude slightly shifted to avoid dense housing
// while keeping a straight corridor that feels like track.
const DEFAULT_TRACK: [number, number][] = [
  [19.1000, -98.3000],
  [19.1001, -98.3001],
  [19.1002, -98.3002],
  [19.1003, -98.3003],
  [19.1004, -98.3004],
  [19.1005, -98.3005],
  [19.1006, -98.3006],
  [19.1007, -98.3007],
  [19.1008, -98.3008],
  [19.1009, -98.3009],
  [19.1010, -98.3010],
];

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

export default function TrackMap({ points = DEFAULT_TRACK }: TrackMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const stepIndexRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapboxgl.accessToken) {
      // eslint-disable-next-line no-console
      console.error("Mapbox token missing. Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN.");
      return;
    }

    const center = points[Math.floor(points.length / 2)];

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12", // realistic street map
      center: [center[1], center[0]], // [lng, lat]
      zoom: 18, // very tight zoom so the trail dominates the view
      interactive: false, // disable user interaction; we'll control movement
    });

    mapRef.current = map;

    // Tilt the camera a bit to get a 3D perspective
    map.setPitch(60);
    map.setBearing(0);

    map.on("load", () => {
      const lineString = {
        type: "FeatureCollection" as const,
        features: [
          {
            type: "Feature" as const,
            geometry: {
              type: "LineString" as const,
              coordinates: points.map(([lat, lng]) => [lng, lat]),
            },
            properties: {},
          },
        ],
      };

      if (!map.getSource("track")) {
        map.addSource("track", {
          type: "geojson",
          data: lineString,
        });
      }

      if (!map.getLayer("track-line")) {
        map.addLayer({
          id: "track-line",
          type: "line",
          source: "track",
          // Cast to any to avoid strict Mapbox type issues while
          // still using the documented paint properties.
          paint: {
            "line-color": "#22c55e",
            "line-width": 24,
            "line-cap": "round",
            "line-join": "round",
          } as any,
        });
      }

      // Add simple 3D buildings layer to enhance depth perception
      const layers = map.getStyle().layers;
      const labelLayerId = layers?.find(
        (l) => l.type === "symbol" && (l.layout as any)?.["text-field"]
      )?.id;

      if (!map.getLayer("3d-buildings")) {
        map.addLayer(
          {
            id: "3d-buildings",
            source: "composite",
            "source-layer": "building",
            filter: ["==", "extrude", "true"],
            type: "fill-extrusion",
            minzoom: 15,
            paint: {
              "fill-extrusion-color": "#d1d5db",
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                16,
                ["get", "height"],
              ],
              "fill-extrusion-base": ["get", "min_height"],
              "fill-extrusion-opacity": 0.7,
            },
          } as any,
          labelLayerId
        );
      }
    });

    // Simple camera animation that moves along the rail
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    stepIndexRef.current = 0;
    intervalRef.current = setInterval(() => {
      if (!mapRef.current) return;
      const idx = stepIndexRef.current % points.length;
      const [lat, lng] = points[idx];
      // Slower, smoother movement along the rail
      mapRef.current.easeTo({ center: [lng, lat], duration: 2000 });
      stepIndexRef.current += 1;
    }, 2600);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
  }, [points]);

  return (
    <div className="w-full h-full rounded-3xl overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}

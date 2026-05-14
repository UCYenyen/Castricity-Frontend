"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface RotatingEarthProps {
  width?: number;
  height?: number;
  className?: string;
}

interface GeoFeature {
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
  properties?: Record<string, unknown>;
}

interface CountryFeature extends GeoFeature {
  properties?: {
    ISO_A2?: string;
    ISO_A3?: string;
    NAME?: string;
    ADMIN?: string;
    [k: string]: unknown;
  };
}

interface GeoCollection {
  features: GeoFeature[];
}

interface CountryCollection {
  features: CountryFeature[];
}

export default function RotatingEarth({
  width = 800,
  height = 600,
  className = "",
}: RotatingEarthProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    const containerWidth = Math.min(width, window.innerWidth - 40);
    const containerHeight = Math.min(height, window.innerHeight - 100);
    const radius = Math.min(containerWidth, containerHeight) / 2.5;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;
    context.scale(dpr, dpr);

    const projection = d3
      .geoOrthographic()
      .scale(radius)
      .translate([containerWidth / 2, containerHeight / 2])
      .clipAngle(90);

    const path = d3.geoPath().projection(projection).context(context);

    const pointInPolygon = (point: [number, number], polygon: number[][]) => {
      const [x, y] = point;
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
          inside = !inside;
        }
      }
      return inside;
    };

    const pointInFeature = (point: [number, number], feature: GeoFeature) => {
      const geometry = feature.geometry;
      if (geometry.type === "Polygon") {
        const coordinates = geometry.coordinates as number[][][];
        if (!pointInPolygon(point, coordinates[0])) return false;
        for (let i = 1; i < coordinates.length; i++) {
          if (pointInPolygon(point, coordinates[i])) return false;
        }
        return true;
      }
      if (geometry.type === "MultiPolygon") {
        const coordinates = geometry.coordinates as number[][][][];
        for (const polygon of coordinates) {
          if (pointInPolygon(point, polygon[0])) {
            let inHole = false;
            for (let i = 1; i < polygon.length; i++) {
              if (pointInPolygon(point, polygon[i])) {
                inHole = true;
                break;
              }
            }
            if (!inHole) return true;
          }
        }
      }
      return false;
    };

    const generateDotsInPolygon = (feature: GeoFeature, dotSpacing = 16) => {
      const dots: [number, number][] = [];
      // d3.geoBounds accepts GeoJSON feature; cast for our minimal type
      const bounds = d3.geoBounds(feature as unknown as d3.GeoPermissibleObjects);
      const [[minLng, minLat], [maxLng, maxLat]] = bounds;
      const stepSize = dotSpacing * 0.08;
      for (let lng = minLng; lng <= maxLng; lng += stepSize) {
        for (let lat = minLat; lat <= maxLat; lat += stepSize) {
          const point: [number, number] = [lng, lat];
          if (pointInFeature(point, feature)) dots.push(point);
        }
      }
      return dots;
    };

    const allDots: { lng: number; lat: number }[] = [];
    let landFeatures: GeoCollection | null = null;
    let indonesia: CountryFeature | null = null;

    const render = () => {
      context.clearRect(0, 0, containerWidth, containerHeight);
      const currentScale = projection.scale();
      const scaleFactor = currentScale / radius;

      context.beginPath();
      context.arc(containerWidth / 2, containerHeight / 2, currentScale, 0, 2 * Math.PI);
      context.fillStyle = "#050a15";
      context.fill();
      context.strokeStyle = "rgba(6,182,212,0.6)";
      context.lineWidth = 2 * scaleFactor;
      context.stroke();

      if (landFeatures) {
        const graticule = d3.geoGraticule();
        context.beginPath();
        path(graticule());
        context.strokeStyle = "rgba(6,182,212,0.35)";
        context.lineWidth = 1 * scaleFactor;
        context.globalAlpha = 0.25;
        context.stroke();
        context.globalAlpha = 1;

        context.beginPath();
        landFeatures.features.forEach((feature) => {
          path(feature as unknown as d3.GeoPermissibleObjects);
        });
        context.strokeStyle = "rgba(6,182,212,0.9)";
        context.lineWidth = 1 * scaleFactor;
        context.stroke();

        allDots.forEach((dot) => {
          const projected = projection([dot.lng, dot.lat]);
          if (
            projected &&
            projected[0] >= 0 &&
            projected[0] <= containerWidth &&
            projected[1] >= 0 &&
            projected[1] <= containerHeight
          ) {
            context.beginPath();
            context.arc(projected[0], projected[1], 1.2 * scaleFactor, 0, 2 * Math.PI);
            context.fillStyle = "rgba(165,243,252,0.85)";
            context.fill();
          }
        });

        // Highlight Indonesia with a solid fill, drawn last so it stays on top.
        if (indonesia) {
          context.beginPath();
          path(indonesia as unknown as d3.GeoPermissibleObjects);
          context.fillStyle = "rgba(6,182,212,0.85)";
          context.fill();
          context.strokeStyle = "rgba(165,243,252,1)";
          context.lineWidth = 1.5 * scaleFactor;
          context.stroke();
        }
      }
    };

    const loadWorldData = async () => {
      try {
        setIsLoading(true);
        const [landRes, countriesRes] = await Promise.all([
          fetch(
            "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json"
          ),
          fetch(
            "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/cultural/ne_110m_admin_0_countries.json"
          ),
        ]);
        if (!landRes.ok) throw new Error("Failed to load land data");
        landFeatures = (await landRes.json()) as GeoCollection;

        if (countriesRes.ok) {
          const countries = (await countriesRes.json()) as CountryCollection;
          indonesia =
            countries.features.find((f) => {
              const p = f.properties;
              if (!p) return false;
              const name = (p.NAME ?? p.ADMIN ?? "") as string;
              const iso2 = (p.ISO_A2 ?? "") as string;
              const iso3 = (p.ISO_A3 ?? "") as string;
              return name === "Indonesia" || iso2 === "ID" || iso3 === "IDN";
            }) ?? null;
        }

        landFeatures.features.forEach((feature) => {
          const dots = generateDotsInPolygon(feature, 16);
          dots.forEach(([lng, lat]) => allDots.push({ lng, lat }));
        });

        render();
        setIsLoading(false);
      } catch {
        setError("Failed to load land map data");
        setIsLoading(false);
      }
    };

    // Center on Indonesia (~118°E, 2°S). Orthographic rotate uses [-lng, -lat].
    const HOME: [number, number] = [-118, 2];
    const rotation: [number, number] = [HOME[0], HOME[1]];
    projection.rotate(rotation);

    let returnTimer: d3.Timer | null = null;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animateBackHome = () => {
      if (returnTimer) returnTimer.stop();
      const from: [number, number] = [rotation[0], rotation[1]];
      // Shortest-path delta for longitude (wrap to [-180,180])
      let dLng = HOME[0] - from[0];
      dLng = ((dLng + 180) % 360 + 360) % 360 - 180;
      const dLat = HOME[1] - from[1];
      const duration = 900;

      returnTimer = d3.timer((elapsed) => {
        const t = Math.min(1, elapsed / duration);
        const e = easeOutCubic(t);
        rotation[0] = from[0] + dLng * e;
        rotation[1] = from[1] + dLat * e;
        projection.rotate(rotation);
        render();
        if (t >= 1) {
          returnTimer?.stop();
          returnTimer = null;
        }
      });
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (returnTimer) {
        returnTimer.stop();
        returnTimer = null;
      }
      const startX = event.clientX;
      const startY = event.clientY;
      const startRotation: [number, number] = [rotation[0], rotation[1]];

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const sensitivity = 0.5;
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        rotation[0] = startRotation[0] + dx * sensitivity;
        rotation[1] = Math.max(-90, Math.min(90, startRotation[1] - dy * sensitivity));
        projection.rotate(rotation);
        render();
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        animateBackHome();
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    canvas.addEventListener("mousedown", handleMouseDown);

    loadWorldData();

    return () => {
      if (returnTimer) returnTimer.stop();
      canvas.removeEventListener("mousedown", handleMouseDown);
    };
  }, [width, height]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-card rounded-2xl p-8 ${className}`}
      >
        <div className="text-center">
          <p className="text-accent-red font-semibold mb-2">
            Error loading Earth visualization
          </p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded-2xl"
        style={{ maxWidth: "100%", height: "auto" }}
      />
      <div className="pointer-events-none absolute bottom-3 left-3 text-[10px] uppercase tracking-[0.14em] text-text-faint mono px-2 py-1 rounded-md bg-popover/60 border border-border">
        Drag to rotate · Releases back to Indonesia
      </div>
    </div>
  );
}

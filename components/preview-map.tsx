"use client";

import { useEffect, useRef, useState } from "react";
import type { StyleSpecification } from "maplibre-gl";
import type { FieldDef, Locale } from "@/lib/types";
import "maplibre-gl/dist/maplibre-gl.css";

type BasemapId = "light" | "dark" | "streets" | "topo" | "imagery";

type RasterPaint = {
  opacity?: number;
  saturation?: number;
  hueRotate?: number;
  brightnessMin?: number;
  brightnessMax?: number;
  contrast?: number;
};

type Props = {
  src: string;
  geometry: "polygon" | "polyline" | "point";
  color?: string;
  height?: number;
  interactive?: boolean;
  className?: string;
  label?: string;
  watermark?: string;
  padding?: number;
  /** Initial basemap (for thumbnails / embeds). */
  basemap?: BasemapId;
  /** Show basemap switcher UI (defaults to interactive). */
  showControls?: boolean;
  /** Recolor/tint raster basemaps (imagery) per dataset. */
  rasterPaint?: RasterPaint;
  /** Optional data-driven coloring by a feature property (e.g. land cover class). */
  colorProperty?: string;
  /** Map of property value -> color for data-driven coloring. */
  colorMap?: Record<string, string>;
  /** Field dictionary used to label feature attributes in the click popup. */
  fields?: FieldDef[];
  /** Popup language. */
  locale?: Locale;
  /** Responsive height classes; when set, overrides `height`. */
  heightClassName?: string;
};

function rasterStyle(
  tiles: string[],
  attribution: string,
  background = "#e9e7e1",
  paint: RasterPaint = {},
): StyleSpecification {
  const rasterPaint: Record<string, number> = { "raster-opacity": paint.opacity ?? 1 };
  if (paint.saturation != null) rasterPaint["raster-saturation"] = paint.saturation;
  if (paint.hueRotate != null) rasterPaint["raster-hue-rotate"] = paint.hueRotate;
  if (paint.brightnessMin != null) rasterPaint["raster-brightness-min"] = paint.brightnessMin;
  if (paint.brightnessMax != null) rasterPaint["raster-brightness-max"] = paint.brightnessMax;
  if (paint.contrast != null) rasterPaint["raster-contrast"] = paint.contrast;
  return {
    version: 8,
    sources: {
      basemap: { type: "raster", tiles, tileSize: 256, maxzoom: 19, attribution },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": background } },
      { id: "basemap", type: "raster", source: "basemap", paint: rasterPaint },
    ],
  };
}

/**
 * Every basemap here is keyless — no API key, no token, no watermark:
 *  - light / streets: OpenFreeMap vector styles (attribution via TileJSON)
 *  - dark / topo / imagery: Esri ArcGIS Online raster tiles
 * The old CARTO public tiles now render "API KEY REQUIRED", so they are not used.
 */
const BASEMAP_ORDER: BasemapId[] = ["light", "dark", "streets", "topo", "imagery"];
const BASEMAP_LABEL: Record<BasemapId, string> = {
  light: "Light",
  dark: "Dark",
  streets: "Streets",
  topo: "Topo",
  imagery: "Imagery",
};

function getBasemapStyle(id: BasemapId, paint: RasterPaint = {}): string | StyleSpecification {
  // Apply raster recolor/tint when provided (useful for "imagery, but recolored" thumbnails).
  const hasPaint = Object.values(paint).some((v) => v != null);
  if (id === "light") return hasPaint ? rasterStyle(["https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"], "© OpenStreetMap contributors, © CARTO", "#e9e7e1", paint) : "https://tiles.openfreemap.org/styles/positron";
  if (id === "streets") return hasPaint ? rasterStyle(["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], "© OpenStreetMap contributors", "#e9e7e1", paint) : "https://tiles.openfreemap.org/styles/bright";
  if (id === "dark")
    return rasterStyle(["https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"], "Esri, HERE, Garmin, © OpenStreetMap contributors", "#16181a", paint);
  if (id === "topo")
    return rasterStyle(["https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"], "Esri, HERE, Garmin, USGS, © OpenStreetMap contributors", "#e9e7e1", paint);
  return rasterStyle(["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], "Esri, Maxar, Earthstar Geographics", "#0b0f0c", paint);
}

/* ------------------------------------------------------- feature popups */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function humanize(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (c) => c.toUpperCase());
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)?$/;

function formatPopupValue(value: unknown, type: FieldDef["type"] | undefined, locale: Locale): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") {
    return value ? (locale === "fil" ? "Oo" : "Yes") : locale === "fil" ? "Hindi" : "No";
  }
  if (typeof value === "number") {
    if (type === "integer" || type === "double") {
      return value.toLocaleString(locale === "fil" ? "fil-PH" : "en-PH", {
        maximumFractionDigits: type === "integer" ? 0 : 2,
      });
    }
    return String(value);
  }
  if (typeof value === "string") {
    if (DATE_RE.test(value)) {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString(locale === "fil" ? "fil-PH" : "en-PH", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
    }
    return value;
  }
  return JSON.stringify(value);
}

function buildPopupHtml(
  feature: GeoJSON.Feature,
  options: { title: string; fields?: FieldDef[]; locale: Locale; lng: number; lat: number },
): string {
  const { title, fields, locale } = options;
  const meta = new Map((fields ?? []).map((field) => [field.name, field]));

  const rows: { label: string; value: string }[] = [];
  for (const [key, raw] of Object.entries(feature.properties ?? {})) {
    if (key.startsWith("__")) continue;
    const definition = meta.get(key);
    const formatted = formatPopupValue(raw, definition?.type, locale);
    if (!formatted || !formatted.trim()) continue;
    const value = formatted.length > 240 ? `${formatted.slice(0, 240)}…` : formatted;
    rows.push({ label: definition?.alias || humanize(key), value });
  }

  const shown = rows.slice(0, 8);
  const hidden = rows.length - shown.length;
  const geom = feature.geometry?.type ?? "Feature";
  const geometryLabel = geom.includes("Point")
    ? locale === "fil"
      ? "Punto"
      : "Point"
    : geom.includes("Line")
      ? locale === "fil"
        ? "Linya"
        : "Line"
      : locale === "fil"
        ? "Polygon"
        : "Polygon";

  const table = shown.length
    ? `<table style="width:100%;border-collapse:collapse;margin-top:2px;">${shown
        .map(
          (row) => `<tr>
            <td style="padding:4px 0;vertical-align:top;width:42%;font-size:10.5px;line-height:1.35;letter-spacing:.02em;text-transform:uppercase;color:#6b7c73;">${escapeHtml(
              row.label,
            )}</td>
            <td style="padding:4px 0 4px 10px;vertical-align:top;font-size:12px;line-height:1.45;font-weight:600;color:#1f2d27;word-break:break-word;">${escapeHtml(
              row.value,
            )}</td>
          </tr>`,
        )
        .join("")}</table>`
    : `<p style="margin:2px 0 0;font-size:11.5px;line-height:1.5;color:#6b7c73;">${
        locale === "fil" ? "Walang attribute sa preview." : "No attributes in this preview."
      }</p>`;

  const more =
    hidden > 0
      ? `<p style="margin:6px 0 0;font-size:10px;color:#6b7c73;">${
          locale === "fil" ? `+${hidden} pang field` : `+${hidden} more field${hidden === 1 ? "" : "s"}`
        }</p>`
      : "";

  const coords = `${options.lat.toFixed(5)}, ${options.lng.toFixed(5)}`;
  const footer = locale === "fil" ? "Pinaikling preview · limitadong attribute" : "Generalized preview · limited attributes";

  return `<div style="min-width:220px;max-width:300px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <p style="margin:0;font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#8a6d1f;">${escapeHtml(
      geometryLabel,
    )} · ENVIS</p>
    <p style="margin:3px 0 6px;font-size:13.5px;line-height:1.3;font-weight:700;color:#14352a;">${escapeHtml(title)}</p>
    <div style="border-top:1px solid #eee7da;padding-top:2px;">${table}</div>
    ${more}
    <p style="margin:8px 0 0;font-size:10px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#6b7c73;">${coords}</p>
    <p style="margin:6px 0 0;padding-top:6px;border-top:1px solid #eee7da;font-size:9.5px;line-height:1.4;color:#8a978f;">${footer}</p>
  </div>`;
}

export default function PreviewMap({
  src,
  geometry,
  color = "#276b44",
  height = 360,
  interactive = true,
  className = "",
  label,
  watermark,
  padding = 24,
  basemap: initialBasemap = "light",
  showControls,
  rasterPaint,
  colorProperty,
  colorMap,
  fields,
  locale = "en",
  heightClassName,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const dataRef = useRef<GeoJSON.FeatureCollection | null>(null);
  const fittedRef = useRef(false);
  const basemapRef = useRef<BasemapId>(initialBasemap);
  const appliedRef = useRef<BasemapId>(initialBasemap);
  const applyPreviewRef = useRef<(fit: boolean) => void>(() => {});
  const labelRef = useRef(label);
  const fieldsRef = useRef(fields);
  const localeRef = useRef(locale);
  labelRef.current = label;
  fieldsRef.current = fields;
  localeRef.current = locale;

  const [basemap, setBasemap] = useState<BasemapId>(initialBasemap);
  const [failed, setFailed] = useState(false);
  const controlsVisible = showControls ?? interactive;

  /* ------------------------------------------------------------- map setup */
  useEffect(() => {
    let cancelled = false;
    let map: import("maplibre-gl").Map | undefined;
    let popup: import("maplibre-gl").Popup | undefined;

    (async () => {
      try {
        // MapLibre v6 ships an ESM-only build, so the module exports are used
        // directly instead of the v5 default export.
        const maplibregl = await import("maplibre-gl");
        if (cancelled || !containerRef.current) return;

        map = new maplibregl.Map({
          container: containerRef.current,
          style: getBasemapStyle(basemapRef.current, rasterPaint),
          center: [123.4, 10.3],
          zoom: 7,
          interactive,
          attributionControl: false,
          dragRotate: false,
          pitchWithRotate: false,
        });
        mapRef.current = map;

        if (interactive) {
          map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
        }
        map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

        let hoveredFeatureId: string | number | undefined;
        let selectedFeatureId: string | number | undefined;

        const previewLayerIds = () =>
          ["preview-points", "preview-line", "preview-fill"].filter((id) => Boolean(map?.getLayer(id)));

        const clearHover = () => {
          if (hoveredFeatureId !== undefined && map?.getSource("preview")) {
            map.setFeatureState({ source: "preview", id: hoveredFeatureId }, { hover: false });
          }
          hoveredFeatureId = undefined;
        };

        const clearSelected = () => {
          if (selectedFeatureId !== undefined && map?.getSource("preview")) {
            map.setFeatureState({ source: "preview", id: selectedFeatureId }, { selected: false });
          }
          selectedFeatureId = undefined;
        };

        const removePopup = () => {
          popup?.remove();
          popup = undefined;
        };

        const applyPreview = (fit: boolean) => {
          if (!map || cancelled) return;
          const data = dataRef.current;
          if (!data) return;

          try {
            if (!map.getStyle()) return;

            if (!map.getSource("preview")) {
              clearHover();
              clearSelected();
              removePopup();
              map.addSource("preview", { type: "geojson", data, generateId: true });

              // Prefer actual geometry in the data over metadata so layers always "plot" correctly.
              const types = new Set(
                (data.features || [])
                  .map((f) => f.geometry?.type)
                  .filter((t): t is NonNullable<typeof t> => t != null),
              );
              const hasPoint = [...types].some((t) => t.includes("Point"));
              const hasLine = [...types].some((t) => t.includes("LineString"));
              const hasPoly = [...types].some((t) => t.includes("Polygon"));
              const renderAs: "point" | "polyline" | "polygon" =
                hasPoint && !hasLine && !hasPoly
                  ? "point"
                  : hasLine && !hasPoly
                    ? "polyline"
                    : hasPoly
                      ? "polygon"
                      : geometry;

              const fillColor: any =
                colorProperty && colorMap
                  ? ["match", ["get", colorProperty], ...Object.entries(colorMap).flat(), color]
                  : color;
              const lineColor: any = fillColor;
              const pointColor: any = fillColor;

              if (renderAs === "point") {
                map.addLayer({
                  id: "preview-halo",
                  type: "circle",
                  source: "preview",
                  paint: { "circle-radius": 11, "circle-color": pointColor, "circle-opacity": 0.18 },
                });
                map.addLayer({
                  id: "preview-points",
                  type: "circle",
                  source: "preview",
                  paint: {
                    "circle-radius": 5,
                    "circle-color": pointColor,
                    "circle-stroke-color": "#ffffff",
                    "circle-stroke-width": 1.5,
                  },
                });
              } else if (renderAs === "polyline") {
                map.addLayer({
                  id: "preview-line",
                  type: "line",
                  source: "preview",
                  paint: { "line-color": lineColor, "line-width": 2.5, "line-opacity": 0.9 },
                });
              } else {
                map.addLayer({
                  id: "preview-fill",
                  type: "fill",
                  source: "preview",
                  paint: { "fill-color": fillColor, "fill-opacity": 0.45 },
                });
                map.addLayer({
                  id: "preview-outline",
                  type: "line",
                  source: "preview",
                  paint: { "line-color": fillColor, "line-width": 1.1, "line-opacity": 0.9 },
                });
              }

              // Hover / selection accents driven by feature-state (no re-query needed).
              map.addLayer({
                id: "preview-highlight-line",
                type: "line",
                source: "preview",
                paint: {
                  "line-color": "#ffffff",
                  "line-width": [
                    "case",
                    ["boolean", ["feature-state", "selected"], false],
                    3.6,
                    ["boolean", ["feature-state", "hover"], false],
                    2.4,
                    0,
                  ],
                  "line-opacity": 0.95,
                },
              });
              map.addLayer({
                id: "preview-highlight-point",
                type: "circle",
                source: "preview",
                filter: ["==", ["geometry-type"], "Point"],
                paint: {
                  "circle-radius": [
                    "case",
                    ["boolean", ["feature-state", "selected"], false],
                    10,
                    ["boolean", ["feature-state", "hover"], false],
                    8,
                    0,
                  ],
                  "circle-color": "rgba(255,255,255,0)",
                  "circle-stroke-color": "#ffffff",
                  "circle-stroke-width": 2.4,
                },
              });
            }

            if (fit && !fittedRef.current) {
              fittedRef.current = true;
              const bounds = new maplibregl.LngLatBounds();
              const walk = (coords: unknown): void => {
                if (!Array.isArray(coords)) return;
                if (typeof coords[0] === "number" && typeof coords[1] === "number") {
                  bounds.extend(coords as [number, number]);
                } else {
                  coords.forEach(walk);
                }
              };
              for (const f of data.features ?? []) {
                walk((f.geometry as { coordinates?: unknown } | null)?.coordinates);
              }
              if (!bounds.isEmpty()) {
                map.fitBounds(bounds, { padding, duration: 0, maxZoom: 11 });
              }
            }
          } catch {
            // Style may not be ready yet (e.g. mid basemap swap); will retry on next style event.
          }
        };

        applyPreviewRef.current = applyPreview;

        const activeMap = map;

        if (interactive) {
          activeMap.on("mousemove", (event) => {
            const layerIds = previewLayerIds();
            if (!layerIds.length) return;
            const hits = activeMap.queryRenderedFeatures(event.point, { layers: layerIds });
            if (!hits.length) {
              clearHover();
              activeMap.getCanvas().style.cursor = "";
              return;
            }
            activeMap.getCanvas().style.cursor = "pointer";
            const feature = hits[0];
            if (feature.id === hoveredFeatureId) return;
            clearHover();
            hoveredFeatureId = feature.id;
            if (hoveredFeatureId !== undefined) {
              activeMap.setFeatureState({ source: "preview", id: hoveredFeatureId }, { hover: true });
            }
          });

          activeMap.on("mouseout", () => {
            clearHover();
            activeMap.getCanvas().style.cursor = "";
          });

          activeMap.on("click", (event) => {
            const layerIds = previewLayerIds();
            if (!layerIds.length) return;
            const hits = activeMap.queryRenderedFeatures(event.point, { layers: layerIds });
            if (!hits.length) {
              clearSelected();
              removePopup();
              return;
            }

            const feature = hits[0];
            clearSelected();
            selectedFeatureId = feature.id;
            if (selectedFeatureId !== undefined) {
              activeMap.setFeatureState({ source: "preview", id: selectedFeatureId }, { selected: true });
            }

            const html = buildPopupHtml(feature, {
              title: labelRef.current ?? (localeRef.current === "fil" ? "Detalye ng feature" : "Feature details"),
              fields: fieldsRef.current,
              locale: localeRef.current,
              lng: event.lngLat.lng,
              lat: event.lngLat.lat,
            });

            removePopup();
            popup = new maplibregl.Popup({
              closeButton: true,
              closeOnClick: false,
              maxWidth: "320px",
              offset: 14,
              className: "envis-popup",
              focusAfterOpen: false,
            })
              .setLngLat(event.lngLat)
              .setHTML(html)
              .addTo(activeMap);
          });
        }

        // Re-add the preview whenever a basemap/style finishes loading.
        map.on("style.load", () => applyPreview(false));
        // Extra safety: some style swaps settle without a second overlay pass.
        map.on("idle", () => applyPreview(false));

        map.once("load", async () => {
          try {
            const data = (await fetch(src).then((r) => {
              if (!r.ok) throw new Error(`preview ${r.status}`);
              return r.json();
            })) as GeoJSON.FeatureCollection;
            if (cancelled) return;
            dataRef.current = data;
            applyPreview(true);
          } catch {
            if (!cancelled) setFailed(true);
          }
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      applyPreviewRef.current = () => {};
      popup?.remove();
      popup = undefined;
      map?.remove();
      mapRef.current = null;
      dataRef.current = null;
      fittedRef.current = false;
      appliedRef.current = initialBasemap;
    };
  }, [src, geometry, color, interactive, padding, rasterPaint, initialBasemap, colorProperty, colorMap]);

  /* --------------------------------------------------------- basemap swap */
  useEffect(() => {
    basemapRef.current = basemap;
    const map = mapRef.current;
    if (!map || appliedRef.current === basemap) return;
    appliedRef.current = basemap;
    map.setStyle(getBasemapStyle(basemap, rasterPaint), { diff: false });
    // Ensure overlay is restored after the new style settles.
    map.once("idle", () => applyPreviewRef.current(false));
  }, [basemap, rasterPaint]);

  return (
    <div
      className={`relative overflow-hidden rounded-[13px] border border-sand-200 bg-sand-100 ${heightClassName ?? ""} ${className}`}
      style={heightClassName ? undefined : { height }}
    >
      <div ref={containerRef} className="h-full w-full" aria-label={label ?? "Map preview"} role="img" />

      {controlsVisible ? (
        <div
          role="group"
          aria-label="Basemap"
          className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-5rem)] flex-wrap gap-0.5 rounded-[9px] border border-sand-200 bg-white/92 p-0.5 shadow-sm backdrop-blur"
        >
          {BASEMAP_ORDER.map((id) => {
            const active = basemap === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setBasemap(id)}
                aria-pressed={active}
                title={`${BASEMAP_LABEL[id]} basemap`}
                className={`rounded-[7px] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] transition ${
                  active ? "bg-forest-900 text-sand-50" : "text-forest-700 hover:bg-forest-100/80"
                }`}
              >
                {BASEMAP_LABEL[id]}
              </button>
            );
          })}
        </div>
      ) : null}

      {watermark ? (
        <span className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-[5px] bg-brass-500/95 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white shadow">
          {watermark}
        </span>
      ) : null}

      {failed ? (
        <div className="absolute inset-0 grid place-items-center bg-forest-50/95 px-6 text-center text-xs text-forest-600">
          Map preview unavailable in this environment.
        </div>
      ) : null}
    </div>
  );
}

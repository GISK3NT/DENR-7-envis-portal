/**
 * build-previews.mjs
 * ----------------------------------------------------------------------------
 * Generates the LOSSY preview geometry used by the public catalog.
 *
 * Rules enforced here:
 *  - Real administrative boundaries come from DENR's PUBLIC ArcGIS service.
 *  - Thematic demo layers are SYNTHETIC placeholders, clipped (by centre point)
 *    to province polygons and tagged `demo: true`.
 *  - Coordinates are rounded to 3 decimals (~110 m) and rings are simplified,
 *    so a preview can never be used as a deliverable.
 *  - Only whitelisted display attributes are written.
 *
 * Run: npm run previews
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "previews");
const ARCGIS = "https://fmbfsd.denr.gov.ph/server/rest/services";
const ROUND = 3; // decimals
const TOLERANCE = 0.004; // degrees, ~440 m

const PROVINCES = [
  { id: "bohol", name: "Bohol" },
  { id: "cebu", name: "Cebu" },
  { id: "negros-oriental", name: "Negros Oriental" },
  { id: "siquijor", name: "Siquijor" },
];

/* ------------------------------------------------------------------ utils */

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const r5 = (n) => Math.round(n * 10 ** ROUND) / 10 ** ROUND;

function perpDist(p, a, b) {
  const [x, y] = p;
  const [x1, y1] = a;
  const [x2, y2] = b;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

function simplify(points, tol) {
  if (points.length <= 4) return points;
  let maxD = 0;
  let idx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], points[0], points[points.length - 1]);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD > tol) {
    const left = simplify(points.slice(0, idx + 1), tol);
    const right = simplify(points.slice(idx), tol);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[points.length - 1]];
}

function ringArea(ring) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return Math.abs(a / 2);
}

function cleanRing(ring, tol) {
  let out = simplify(ring, tol).map(([x, y]) => [r5(x), r5(y)]);
  // drop consecutive duplicates created by rounding
  out = out.filter((p, i) => {
    if (i === 0) return true;
    const q = out[i - 1];
    return p[0] !== q[0] || p[1] !== q[1];
  });
  if (out.length) {
    const first = out[0];
    const last = out[out.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) out.push([...first]);
  }
  return out;
}

function cleanPolygonRings(rings) {
  return rings
    .map((ring) => cleanRing(ring, TOLERANCE))
    .filter((ring) => ring.length >= 4)
    .sort((a, b) => ringArea(b) - ringArea(a));
}

function simplifyGeometry(geom) {
  if (!geom) return null;
  if (geom.type === "Polygon") {
    const rings = cleanPolygonRings(geom.coordinates);
    return rings.length ? { type: "Polygon", coordinates: rings } : null;
  }
  if (geom.type === "MultiPolygon") {
    const polys = geom.coordinates
      .map((rings) => cleanPolygonRings(rings))
      .filter((rings) => rings.length);
    return polys.length ? { type: "MultiPolygon", coordinates: polys } : null;
  }
  if (geom.type === "Point") return { type: "Point", coordinates: geom.coordinates.map(r5) };
  if (geom.type === "LineString") {
    return { type: "LineString", coordinates: geom.coordinates.map(([x, y]) => [r5(x), r5(y)]) };
  }
  return null;
}

function pointInRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function pointInProvince(pt, geom) {
  if (!geom) return false;
  if (geom.type === "Polygon") return pointInRing(pt, geom.coordinates[0]);
  if (geom.type === "MultiPolygon") {
    return geom.coordinates.some((rings) => pointInRing(pt, rings[0]));
  }
  return false;
}

function bboxOf(geom) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  const walk = (coords) => {
    if (typeof coords[0] === "number") {
      minX = Math.min(minX, coords[0]);
      minY = Math.min(minY, coords[1]);
      maxX = Math.max(maxX, coords[0]);
      maxY = Math.max(maxY, coords[1]);
    } else coords.forEach(walk);
  };
  walk(geom.coordinates);
  return [minX, minY, maxX, maxY];
}

async function fetchFeatures(service, layer, where, outFields = "*") {
  const url =
    `${ARCGIS}/${service}/${layer}/query?where=${encodeURIComponent(where)}` +
    `&outFields=${encodeURIComponent(outFields)}&outSR=4326&f=geojson&returnGeometry=true`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`ArcGIS ${res.status} for ${service}/${layer}`);
  const json = await res.json();
  if (json.error) throw new Error(`ArcGIS error: ${json.error.message}`);
  return json.features ?? [];
}

/* ------------------------------------------------------- synthetic shapes */

function randomPointIn(provinceGeom, rng, tries = 300) {
  const [minX, minY, maxX, maxY] = bboxOf(provinceGeom);
  for (let i = 0; i < tries; i++) {
    const p = [minX + rng() * (maxX - minX), minY + rng() * (maxY - minY)];
    if (pointInProvince(p, provinceGeom)) return p;
  }
  return [(minX + maxX) / 2, (minY + maxY) / 2];
}

function blobAt(cx, cy, radius, rng, vertices = 11) {
  const ring = [];
  for (let i = 0; i < vertices; i++) {
    const angle = (i / vertices) * Math.PI * 2;
    const rr = radius * (0.6 + rng() * 0.75);
    ring.push([r5(cx + Math.cos(angle) * rr), r5(cy + Math.sin(angle) * rr * 0.82)]);
  }
  ring.push([...ring[0]]);
  return { type: "Polygon", coordinates: [ring] };
}

/* Named demo anchors keep the protected-area layer recognisable on the map. */
const PA_ANCHORS = [
  { name: "Chocolate Hills Natural Monument", cat: "Natural Monument", lng: 124.166, lat: 9.916, r: 0.11, ha: 14145 },
  { name: "Rajah Sikatuna Protected Landscape", cat: "Protected Landscape", lng: 124.13, lat: 9.72, r: 0.1, ha: 10452 },
  { name: "Loboc Watershed Forest Reserve", cat: "Protected Landscape", lng: 124.03, lat: 9.63, r: 0.09, ha: 9197 },
  { name: "Central Cebu Protected Landscape", cat: "Protected Landscape", lng: 123.75, lat: 10.38, r: 0.16, ha: 28215 },
  { name: "Mananga Watershed Forest Reserve", cat: "Protected Landscape", lng: 123.66, lat: 10.45, r: 0.08, ha: 6325 },
  { name: "Olango Island Wildlife Sanctuary", cat: "Wildlife Sanctuary", lng: 124.05, lat: 10.27, r: 0.05, ha: 1040 },
  { name: "Tañon Strait Protected Seascape", cat: "Protected Seascape", lng: 123.28, lat: 10.05, r: 0.2, ha: 521000 },
  { name: "Balinsasayao Twin Lakes Natural Park", cat: "Natural Park", lng: 123.18, lat: 9.35, r: 0.06, ha: 8016 },
  { name: "Apo Island Protected Landscape and Seascape", cat: "Protected Seascape", lng: 123.27, lat: 9.07, r: 0.03, ha: 705 },
];

/* ------------------------------------------------------------------ layers */

const LAYERS = [
  {
    slug: "city-municipal-boundaries-r7",
    geometry: "polygon",
    perProvince: [12, 18],
    radius: [0.025, 0.055],
    props: (p, i, rng) => ({
      psgc: `${p.code}${String(1000 + i).slice(-3)}0`,
      lgu_name: `${p.name} LGU ${i + 1}`,
      province: p.name,
      class: ["1st", "2nd", "3rd", "4th", "5th"][Math.floor(rng() * 5)],
      population: Math.floor(18000 + rng() * 180000),
    }),
  },
  {
    slug: "barangay-boundaries-r7",
    geometry: "polygon",
    perProvince: [26, 40],
    radius: [0.006, 0.017],
    props: (p, i, rng) => ({
      psgc: `${p.code}${String(2000 + i).slice(-3)}00`,
      brgy_name: `Barangay ${i + 1}`,
      lgu_name: `${p.name} LGU ${(i % 9) + 1}`,
      province: p.name,
      households: Math.floor(80 + rng() * 1200),
    }),
  },
  {
    slug: "land-classification-r7",
    geometry: "polygon",
    perProvince: [5, 8],
    radius: [0.07, 0.16],
    props: (p, i, rng) => {
      const cls = rng() > 0.42 ? "Forestland" : "Alienable & Disposable";
      return {
        lc_class: cls,
        lmb_ref: `LMB-R7-${p.code}-${String(100 + i)}`,
        province: p.name,
        area_ha: Math.round(2000 + rng() * 22000),
      };
    },
  },
  {
    slug: "forest-cover-2025-r7",
    geometry: "polygon",
    perProvince: [10, 16],
    radius: [0.03, 0.085],
    props: (p, i, rng) => {
      const type = ["Old growth", "Secondary", "Mangrove", "Plantation"][Math.floor(rng() * 4)];
      return {
        fc_type: type,
        canopy: Math.floor(35 + rng() * 60),
        province: p.name,
        area_ha: Math.round(60 + rng() * 3200),
      };
    },
  },
  {
    slug: "forest-cover-change-r7",
    geometry: "polygon",
    perProvince: [8, 13],
    radius: [0.02, 0.05],
    props: (p, i, rng) => ({
      change: ["Loss", "Gain", "Stable"][Math.floor(rng() * 3)],
      driver: ["Kaingin", "Logging", "Infrastructure", "Plantation", "Natural"][Math.floor(rng() * 5)],
      area_ha: Math.round(15 + rng() * 900),
    }),
  },
  {
    slug: "watersheds-r7",
    geometry: "polygon",
    perProvince: [7, 11],
    radius: [0.06, 0.14],
    props: (p, i, rng) => ({
      ws_name: `Watershed ${p.name.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(2, "0")}`,
      basin_code: `R7-${p.code}-${String(i + 1).padStart(3, "0")}`,
      province: p.name,
      area_ha: Math.round(1200 + rng() * 18000),
    }),
  },
  {
    slug: "critical-watersheds-r7",
    geometry: "polygon",
    perProvince: [1, 3],
    radius: [0.05, 0.09],
    props: (p, i, rng) => ({
      ws_name: `Critical Watershed ${p.name} ${i + 1}`,
      declaration: ["EO 192", "Proclamation 1234", "DAO 2019-12"][Math.floor(rng() * 3)],
      management: ["DENR", "LGU", "LGU-DENR", "NGO"][Math.floor(rng() * 4)],
      area_ha: Math.round(800 + rng() * 9000),
    }),
  },
  {
    slug: "protected-areas-r7",
    geometry: "polygon",
    perProvince: [0, 0],
    radius: [0.05, 0.1],
    props: () => ({}),
  },
  {
    slug: "cbfm-sites-r7",
    geometry: "polygon",
    perProvince: [4, 8],
    radius: [0.015, 0.04],
    props: (p, i, rng) => ({
      cbfm_no: `CBFM-R7-${p.code}-${String(100 + i)}`,
      year_issued: Math.floor(2003 + rng() * 21),
      households: Math.floor(40 + rng() * 260),
      area_ha: Math.round(150 + rng() * 2200),
    }),
  },
  {
    slug: "cadts-calt-r7",
    geometry: "polygon",
    perProvince: [0, 2],
    radius: [0.03, 0.07],
    props: (p, i, rng) => ({
      title_no: `${rng() > 0.6 ? "CADT" : "CALT"}-R7-${p.code}-${String(10 + i)}`,
      title_type: rng() > 0.6 ? "CADT" : "CALT",
      year_issued: Math.floor(2001 + rng() * 23),
      area_ha: Math.round(600 + rng() * 11000),
    }),
  },
  {
    slug: "mangrove-extent-r7",
    geometry: "polygon",
    perProvince: [12, 20],
    radius: [0.004, 0.012],
    props: (p, i, rng) => ({
      density: ["Dense", "Moderate", "Sparse"][Math.floor(rng() * 3)],
      species: ["Rhizophora", "Avicennia", "Sonneratia", "Mixed"][Math.floor(rng() * 4)],
      province: p.name,
      area_ha: Math.round(2 + rng() * 140),
    }),
  },
  {
    slug: "marine-protected-areas-r7",
    geometry: "polygon",
    perProvince: [3, 6],
    radius: [0.008, 0.025],
    props: (p, i, rng) => ({
      mpa_name: `MPA ${p.name} ${i + 1}`,
      management: ["LGU", "PO", "Barangay", "National"][Math.floor(rng() * 4)],
      year_est: Math.floor(1996 + rng() * 28),
      area_ha: Math.round(10 + rng() * 900),
    }),
  },
  {
    slug: "air-quality-stations-r7",
    geometry: "point",
    perProvince: [2, 5],
    props: (p, i, rng) => ({
      station: `AQMS-${p.code}-${String(i + 1).padStart(2, "0")}`,
      station_type: rng() > 0.4 ? "Continuous" : "Manual",
      parameters: ["PM2.5, PM10", "PM10, TSP", "NO2, SO2, O3", "TSP"][Math.floor(rng() * 4)],
      lgu_name: `${p.name} LGU ${(i % 6) + 1}`,
    }),
  },
  {
    slug: "water-quality-stations-r7",
    geometry: "point",
    perProvince: [6, 10],
    props: (p, i, rng) => ({
      station: `WQMS-${p.code}-${String(i + 1).padStart(2, "0")}`,
      water_body: `${p.name} River ${(i % 4) + 1}`,
      classification: ["AA", "A", "B", "C", "D", "SA", "SB", "SC"][Math.floor(rng() * 8)],
      lgu_name: `${p.name} LGU ${(i % 7) + 1}`,
    }),
  },
];

/* -------------------------------------------------------------------- main */

async function main() {
  console.log("→ fetching public DENR boundaries …");
  const provinceFeatures = await fetchFeatures(
    "Hosted/Provincial_Boundary/FeatureServer",
    "0",
    "region='VII'",
    "province,region,province_",
  );
  const regionFeatures = await fetchFeatures(
    "Hosted/Regional_Boundary/FeatureServer",
    "0",
    "region_='VII'",
    "region,region_",
  );

  if (provinceFeatures.length !== 4) {
    throw new Error(`expected 4 provinces, got ${provinceFeatures.length}`);
  }

  const provinces = provinceFeatures.map((f) => {
    const name = String(f.properties.province ?? "").trim();
    const id = PROVINCES.find((p) => p.name.toLowerCase() === name.toLowerCase())?.id ?? name.toLowerCase();
    const code = PROVINCES.find((p) => p.id === id)?.code ?? "0700";
    return { id, name, code, geometry: simplifyGeometry(f.geometry), source: f.geometry };
  });

  await mkdir(OUT_DIR, { recursive: true });
  const manifest = { generatedAt: new Date().toISOString(), round: ROUND, layers: [] };

  /* --- real, public boundaries --- */
  const regionGeom = simplifyGeometry(regionFeatures[0]?.geometry);
  if (regionGeom) {
    manifest.layers.push(
      await emit("region-7-boundary", [{
        type: "Feature",
        properties: { region: "VII", name: "Central Visayas", demo: false },
        geometry: regionGeom,
      }]),
    );
  }

  manifest.layers.push(
    await emit("provincial-boundaries-r7", provinces.map((p) => ({
      type: "Feature",
      properties: { province: p.name, prov_code: p.code, region: "VII", demo: false },
      geometry: p.geometry,
    }))),
  );

  console.log("→ generating synthetic preview layers (SAMPLE only) …");

  for (const layer of LAYERS) {
    const rng = mulberry32(hash(layer.slug));
    const features = [];

    if (layer.slug === "protected-areas-r7") {
      for (const pa of PA_ANCHORS) {
        features.push({
          type: "Feature",
          properties: {
            pa_name: pa.name,
            category: pa.cat,
            legal_basis: "NIPAS Act (R.A. 7586)",
            area_ha: pa.ha,
            demo: true,
          },
          geometry: blobAt(pa.lng, pa.lat, pa.r, rng, 13),
        });
      }
    } else {
      for (const p of provinces) {
        const [lo, hi] = layer.perProvince;
        const count = lo + Math.floor(rng() * (hi - lo + 1));
        for (let i = 0; i < count; i++) {
          const [x, y] = randomPointIn(p.geometry, rng);
          if (layer.geometry === "point") {
            features.push({
              type: "Feature",
              properties: { ...layer.props(p, i, rng), demo: true },
              geometry: { type: "Point", coordinates: [r5(x), r5(y)] },
            });
          } else {
            const [rMin, rMax] = layer.radius;
            const r = rMin + rng() * (rMax - rMin);
            features.push({
              type: "Feature",
              properties: { ...layer.props(p, i, rng), demo: true },
              geometry: blobAt(x, y, r, rng),
            });
          }
        }
      }
    }

    manifest.layers.push(await emit(layer.slug, features));
  }

  await writeFile(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  console.log(`✓ wrote ${manifest.layers.length} preview layers to public/previews`);
}

async function emit(slug, features) {
  const clean = features.filter((f) => f.geometry);
  const fc = {
    type: "FeatureCollection",
    metadata: {
      preview: true,
      generalized: `coordinates rounded to ${ROUND} decimals, rings simplified`,
      source: "Preview artefact — not the deliverable dataset",
    },
    features: clean,
  };
  const file = `${slug}.geojson`;
  await writeFile(path.join(OUT_DIR, file), JSON.stringify(fc), "utf8");
  const demo = clean.some((f) => f.properties?.demo);
  console.log(`  · ${file.padEnd(36)} ${String(clean.length).padStart(4)} features${demo ? "  [SAMPLE]" : "  [PUBLIC]"}`);
  return { slug, file: `/previews/${file}`, features: clean.length, demo };
}

main().catch((err) => {
  console.error("\n✗ preview build failed:", err.message);
  process.exit(1);
});

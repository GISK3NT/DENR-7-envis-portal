/**
 * inventory.mjs
 * ----------------------------------------------------------------------------
 * Scans private_data/ for shapefiles and writes catalog stubs to
 * data/datasets.inventory.json. It never copies the source files anywhere
 * public and never exposes their absolute paths.
 *
 *   npm run inventory                     # scan only
 *   npm run inventory -- --write-previews # also emit generalized previews
 *   npm run inventory -- --fields a,b,c   # whitelist attributes in previews
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, "private_data");
const OUT_JSON = path.join(ROOT, "data", "datasets.inventory.json");
const PREVIEW_DIR = path.join(ROOT, "public", "previews");
const MAPSHAPER = path.join(ROOT, "node_modules", "mapshaper", "bin", "mapshaper");

const args = process.argv.slice(2);
const writePreviews = args.includes("--write-previews");
const fieldsArg = args.find((a) => a.startsWith("--fields"));
const whitelist =
  fieldsArg
    ?.split("=")[1]
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.name.toLowerCase().endsWith(".shp")) out.push(full);
  }
  return out;
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\.shp$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleFrom(slug) {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function roundCoords(geometry, decimals = 3) {
  const r = (n) => Math.round(n * 10 ** decimals) / 10 ** decimals;
  const walk = (coords) =>
    typeof coords[0] === "number" ? [r(coords[0]), r(coords[1])] : coords.map(walk);
  if (!geometry) return geometry;
  return { ...geometry, coordinates: walk(geometry.coordinates) };
}

async function info(file) {
  try {
    const { stdout } = await exec("node", [MAPSHAPER, "-i", file, "-info"], { maxBuffer: 32 * 1024 * 1024 });
    return JSON.parse(stdout);
  } catch (error) {
    return { error: String(error.message ?? error) };
  }
}

async function makePreview(file, slug) {
  const target = path.join(PREVIEW_DIR, `${slug}.geojson`);
  const commands = ["-i", file];

  if (whitelist.length) {
    commands.push("-filter-fields", whitelist.join(","));
  } else {
    commands.push("-each", "this.properties = {}");
  }
  commands.push("-simplify", "4%", "keep-shapes", "-o", target, "format=geojson");

  await exec("node", [MAPSHAPER, ...commands], { maxBuffer: 64 * 1024 * 1024 });

  const raw = JSON.parse(await readFile(target, "utf8"));
  const features = (raw.features ?? []).map((f) => ({
    type: "Feature",
    properties: { ...(f.properties ?? {}), demo: false },
    geometry: roundCoords(f.geometry),
  }));

  await writeFile(
    path.join(PREVIEW_DIR, `${slug}.geojson`),
    JSON.stringify({
      type: "FeatureCollection",
      metadata: {
        preview: true,
        generalized: "coordinates rounded to 3 decimals, simplified to 4%",
        source: "Preview artefact - not the deliverable dataset",
      },
      features,
    }),
  );

  return features.length;
}

async function main() {
  const files = await walk(SOURCE_DIR);
  if (!files.length) {
    console.log("• No shapefiles found in private_data/. Add folders there, then run again.");
    return;
  }

  await mkdir(PREVIEW_DIR, { recursive: true });
  const stubs = [];

  for (const file of files) {
    const slug = slugify(path.basename(file));
    const meta = await info(file);
    const layer = meta?.layers?.[0];
    const fields = layer?.fields ?? [];
    const geometryType =
      layer?.geometry_type === "point"
        ? "point"
        : layer?.geometry_type === "polyline"
          ? "polyline"
          : "polygon";

    let previewFeatures = null;
    if (writePreviews) {
      try {
        previewFeatures = await makePreview(file, slug);
      } catch (error) {
        console.warn(`  ! preview failed for ${slug}: ${error.message}`);
      }
    }

    stubs.push({
      slug,
      title: { en: titleFrom(slug), fil: titleFrom(slug) },
      summary: {
        en: `Placeholder summary for ${titleFrom(slug)}. Edit before publishing.`,
        fil: `Pansamantalang buod para sa ${titleFrom(slug)}. I-edit bago ilathala.`,
      },
      description: {
        en: "Generated from a local shapefile inventory. Add provenance and use notes.",
        fil: "Mula sa lokal na shapefile inventory. Magdagdag ng pinagmulan at tala sa gamit.",
      },
      category: "admin-boundaries",
      tags: [],
      publisher: "DENR Region VII",
      steward: "Unassigned",
      geometryType,
      featureCount: layer?.feature_count ?? null,
      crs: layer?.proj4 ? "projected" : "EPSG:4326",
      fields: fields.map((f) => ({ name: f, alias: f, type: "string" })),
      preview: previewFeatures ? { file: `/previews/${slug}.geojson`, kind: "vector" } : null,
      source: { kind: "local", reference: `private_data/${slug}/`, attribution: "DENR Region VII" },
      isDemo: false,
      access: "request",
      updateFrequency: "As needed",
      lastUpdated: new Date().toISOString().slice(0, 10),
      license: { name: "DENR data sharing agreement", url: "/terms" },
      citation: `Department of Environment and Natural Resources, Region VII. (${new Date().getFullYear()}). ${titleFrom(slug)} [Vector dataset].`,
      provinces: ["bohol", "cebu", "negros-oriental", "siquijor"],
    });

    console.log(
      `  · ${slug.padEnd(40)} ${String(layer?.feature_count ?? "?").padStart(7)} features  ${geometryType}${
        previewFeatures !== null ? `  preview:${previewFeatures}` : ""
      }`,
    );
  }

  await writeFile(OUT_JSON, JSON.stringify(stubs, null, 2));
  console.log(`\n✓ ${stubs.length} dataset stub(s) written to data/datasets.inventory.json`);
  console.log("  Review the file, then merge the entries you want into data/datasets.json.");
}

main().catch((error) => {
  console.error("✗ inventory failed:", error);
  process.exit(1);
});

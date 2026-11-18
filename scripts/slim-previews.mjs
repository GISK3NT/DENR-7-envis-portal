/**
 * slim-previews.mjs
 * ----------------------------------------------------------------------------
 * Re-exports every GeoJSON preview through mapshaper at its current visual
 * precision. The catalog builder rounds coordinates but leaves consecutive
 * duplicate vertices in place, which inflates some files enormously (one
 * land-cover layer is 568 MB). Re-exporting deduplicates those vertices, so
 * the geometry is visually identical while the files become far smaller.
 *
 * Strategy per file:
 *   1. export at 3 decimals (~110 m)
 *   2. if still larger than 60 MB, export at 2 decimals (~1.1 km)
 *   3. wrap the result back into the { type, metadata, features } shape the
 *      preview component expects
 *
 * Originals are NOT touched until the new file has been produced successfully.
 */
import { readdir, stat, readFile, writeFile, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
const ROOT = process.cwd();
const DIR = path.join(ROOT, "public", "previews");
const MS = path.join(ROOT, "node_modules", "mapshaper", "bin", "mapshaper");
const TMP = path.join(ROOT, "public", "previews", ".slim-tmp.geojson");

const MB = (n) => n / 1024 / 1024;
const BIG = 60 * 1024 * 1024;

async function exportAt(src, out, precision) {
  await exec(
    "node",
    [MS, "-i", src, "-o", out, "format=geojson", `precision=${precision}`],
    { maxBuffer: 512 * 1024 * 1024 },
  );
}

async function slim(file) {
  const src = path.join(DIR, file);
  const before = (await stat(src)).size;

  await exportAt(src, TMP, "0.001");
  let after = (await stat(TMP)).size;
  let precision = 3;

  if (after > BIG) {
    await exportAt(src, TMP, "0.01");
    after = (await stat(TMP)).size;
    precision = 2;
  }

  // Re-wrap with the metadata block the app's preview shape expects.
  const raw = JSON.parse(await readFile(TMP, "utf8"));
  const wrapped = {
    type: "FeatureCollection",
    metadata: {
      preview: true,
      generalized: `coordinates rounded to ${precision} decimals; duplicate vertices removed`,
      source: "Preview artefact — not the deliverable dataset",
      catalogued: "2026-11-16",
    },
    features: raw.features ?? [],
  };
  await writeFile(TMP, JSON.stringify(wrapped), "utf8");
  await rename(TMP, src);

  return { file, before, after, precision };
}

async function main() {
  const files = (await readdir(DIR)).filter((f) => f.toLowerCase().endsWith(".geojson"));
  files.sort();

  let totalBefore = 0;
  let totalAfter = 0;
  const rows = [];

  for (const file of files) {
    try {
      const r = await slim(file);
      totalBefore += r.before;
      totalAfter += r.after;
      rows.push(r);
      const pct = r.before ? Math.round((1 - r.after / r.before) * 100) : 0;
      console.log(
        `${file.padEnd(46)} ${MB(r.before).toFixed(1).padStart(8)} MB -> ${MB(r.after)
          .toFixed(2)
          .padStart(7)} MB  (-${pct}%, p${r.precision})`,
      );
    } catch (error) {
      console.error(`FAILED ${file}: ${error instanceof Error ? error.message : error}`);
    }
  }

  try {
    await unlink(TMP);
  } catch {
    /* ignore */
  }

  console.log("");
  console.log(`files: ${rows.length}`);
  console.log(`total: ${MB(totalBefore).toFixed(1)} MB -> ${MB(totalAfter).toFixed(1)} MB`);
}

main();

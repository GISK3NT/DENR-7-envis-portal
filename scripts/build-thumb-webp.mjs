/**
 * build-thumb-webp.mjs
 * ----------------------------------------------------------------------------
 * The SVG thumbnails are vector previews of whole datasets; even after
 * simplification the densest ones are still several megabytes, which is far too
 * heavy for a catalog grid. This script rasterises each thumbnail to a WebP
 * image (800x520, i.e. 2x the 400x260 card) and points data/datasets.json at
 * the raster file.
 *
 * The SVG sources stay out of the repository - they remain in the project
 * backup and can be re-generated from the previews at any time.
 *
 * Run: node scripts/build-thumb-webp.mjs
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const DIR = path.join(ROOT, "public", "previews", "thumbs");
const CATALOG = path.join(ROOT, "data", "datasets.json");

async function main() {
  const files = (await readdir(DIR)).filter((f) => f.toLowerCase().endsWith(".svg"));
  files.sort();

  for (const file of files) {
    const source = path.join(DIR, file);
    const target = path.join(DIR, file.replace(/\.svg$/i, ".webp"));
    await sharp(await readFile(source), { density: 288 })
      .resize(800, 520, { fit: "contain", background: "#e7efe4" })
      .webp({ quality: 84, effort: 5 })
      .toFile(target);
  }

  const raw = await readFile(CATALOG, "utf8");
  const catalog = JSON.parse(raw);
  let updated = 0;

  const fix = (dataset) => {
    const thumb = dataset?.preview?.thumb;
    if (typeof thumb === "string" && thumb.endsWith(".svg")) {
      dataset.preview.thumb = thumb.replace(/\.svg$/i, ".webp");
      updated++;
    }
  };

  if (Array.isArray(catalog)) catalog.forEach(fix);
  else if (Array.isArray(catalog.datasets)) catalog.datasets.forEach(fix);

  await writeFile(CATALOG, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

  console.log(`thumbnails: ${files.length} webp written`);
  console.log(`catalog entries updated: ${updated}`);
}

main();

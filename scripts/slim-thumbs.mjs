/**
 * slim-thumbs.mjs
 * ----------------------------------------------------------------------------
 * The dataset cards use pre-rendered SVG thumbnails in public/previews/thumbs.
 * Those files were exported feature-by-feature at full geometry detail, so a
 * land-cover layer produces tens of thousands of sub-pixel polygons and a
 * 400x260 thumbnail grows to 30 MB.
 *
 * This script keeps the rendered basemap images and every visible polygon, then
 *   - drops polygons whose bounding box is smaller than 0.6 px
 *   - thins vertices closer than 0.25 px (invisible at thumbnail scale)
 *   - rounds the remaining coordinates to 0.1 px
 *
 * Originals live in the project backup.
 */
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";

const DIR = path.join(process.cwd(), "public", "previews", "thumbs");
const MIN_BOX = 0.6;
const MIN_STEP = 0.25;

const round1 = (n) => {
  const v = Math.round(n * 10) / 10;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
};

function parseSubpaths(d) {
  const tokens = d.match(/[MLZ]|-?\d+(?:\.\d+)?/gi) ?? [];
  const subpaths = [];
  let current = null;
  let command = null;
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];
    if (/^[MLZ]$/i.test(token)) {
      command = token.toUpperCase();
      i++;
      if (command === "Z") {
        if (current) current.closed = true;
        current = null;
      }
      if (command === "M") {
        current = { points: [], closed: false };
        subpaths.push(current);
        const x = Number(tokens[i]);
        const y = Number(tokens[i + 1]);
        current.points.push([x, y]);
        i += 2;
        command = "L"; // implicit lineto for following pairs
      }
      continue;
    }
    // coordinate pair
    const x = Number(tokens[i]);
    const y = Number(tokens[i + 1]);
    if (!current) {
      current = { points: [], closed: false };
      subpaths.push(current);
    }
    current.points.push([x, y]);
    i += 2;
  }

  return subpaths;
}

function thin(points) {
  if (points.length <= 2) return points;
  const out = [points[0]];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const [px, py] = out[out.length - 1];
    if (Math.hypot(x - px, y - py) >= MIN_STEP) out.push(points[i]);
  }

  // Always keep the final vertex so shapes stay closed.
  const [lx, ly] = out[out.length - 1];
  if (Math.hypot(last[0] - lx, last[1] - ly) > 0.001) out.push(last);
  return out;
}

function simplifyPath(d) {
  if (!/^[MLZ0-9\s.\-+]+$/i.test(d)) return { paths: [d] };

  const subpaths = parseSubpaths(d);
  const large = [];
  const small = [];

  for (const subpath of subpaths) {
    const pts = subpath.points;
    if (pts.length < 3) continue;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [x, y] of pts) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    // Sub-pixel features: keep them as a tiny square so dense clusters stay
    // solid. They are written as their own path element because the source uses
    // fill-rule="evenodd" - overlapping subpaths would punch holes.
    if (Math.max(maxX - minX, maxY - minY) < MIN_BOX) {
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const h = 0.25;
      small.push(
        `M${round1(cx - h)} ${round1(cy - h)} L${round1(cx + h)} ${round1(cy - h)} L${round1(cx + h)} ${round1(cy + h)} L${round1(cx - h)} ${round1(cy + h)} Z`,
      );
      continue;
    }

    const kept = thin(pts);
    if (kept.length < 3) continue;

    const body = kept.map(([x, y]) => `${round1(x)} ${round1(y)}`).join(" L");
    large.push(`M${body}${subpath.closed ? " Z" : ""}`);
  }

  const paths = [];
  if (large.length) paths.push(large.join(" "));
  if (small.length) paths.push(small.join(" "));
  return { paths };
}

async function slim(file) {
  const full = path.join(DIR, file);
  const before = (await stat(full)).size;
  const svg = await readFile(full, "utf8");

  if (!svg.includes("<path")) return null;

  let kept = 0;
  let out = "";
  let cursor = 0;

  const re = /<path\b([^>]*?)\/>/g;
  let match;
  while ((match = re.exec(svg)) !== null) {
    // Keep everything between paths (rect, basemap images, groups, labels).
    out += svg.slice(cursor, match.index);
    cursor = re.lastIndex;

    const attrs = match[1];
    const dMatch = /d="([^"]*)"/.exec(attrs);
    if (!dMatch) {
      out += match[0];
      kept++;
      continue;
    }
    const result = simplifyPath(dMatch[1]);
    for (const d of result.paths) {
      const newAttrs = attrs.replace(dMatch[0], `d="${d}"`);
      out += `<path${newAttrs}/>`;
      kept++;
    }
    continue;
  }

  out += svg.slice(cursor);
  await writeFile(full, out, "utf8");
  return { file, before, after: Buffer.byteLength(out), kept };
}

async function main() {
  const files = (await readdir(DIR)).filter((f) => f.toLowerCase().endsWith(".svg"));
  files.sort();

  let totalBefore = 0;
  let totalAfter = 0;
  for (const file of files) {
    try {
      const r = await slim(file);
      if (!r) continue;
      totalBefore += r.before;
      totalAfter += r.after;
      const mb = (n) => (n / 1024 / 1024).toFixed(2).padStart(7);
      console.log(
        `${file.padEnd(40)} ${mb(r.before)} -> ${mb(r.after)} MB  paths ${r.kept}`,
      );
    } catch (error) {
      console.error(`FAILED ${file}: ${error instanceof Error ? error.message : error}`);
    }
  }
  const mb = (n) => (n / 1024 / 1024).toFixed(1);
  console.log("");
  console.log(`files: ${files.length}`);
  console.log(`total: ${mb(totalBefore)} MB -> ${mb(totalAfter)} MB`);
}

main();




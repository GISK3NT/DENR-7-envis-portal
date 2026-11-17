import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

/**
 * Public read-only access to the MGB geohazard map images (JPG only).
 *
 * The images may live inside the private `shapefiles/` tree during local
 * development, but for a public deployment set ENVIS_GEOHAZARD_DIR to a folder
 * that contains *only* these publishable JPEGs, so the rest of the private data
 * never sits behind a served directory.
 */
const BASE = path.resolve(
  process.env.ENVIS_GEOHAZARD_DIR ?? path.join(process.cwd(), "shapefiles", "Region VII R7 MGB GEOHAZARDS Jpeg"),
);

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png"]);

function resolveInside(rel: string): string | null {
  if (!rel || rel.includes("\0")) return null;
  const full = path.resolve(BASE, rel);
  const inside = path.relative(BASE, full);
  if (!inside || inside.startsWith("..") || path.isAbsolute(inside)) return null;
  const ext = path.extname(full).toLowerCase();
  if (!IMAGE_EXT.has(ext)) return null;
  return full;
}

export async function GET(req: NextRequest) {
  const rel = req.nextUrl.searchParams.get("path");
  if (rel) {
    const full = resolveInside(rel);
    if (!full) return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    try {
      const stat = await fs.stat(full);
      if (!stat.isFile()) return NextResponse.json({ error: "Not a file" }, { status: 404 });
      const buf = await fs.readFile(full);
      const ext = path.extname(full).toLowerCase();
      const type = ext === ".png" ? "image/png" : "image/jpeg";
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type": type,
          "Content-Length": String(buf.byteLength),
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'; sandbox",
          "Content-Disposition": "inline",
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  // Directory index: provinces plus their image files.
  try {
    const provinces = await fs.readdir(BASE, { withFileTypes: true });
    const result: { province: string; files: { name: string; type: "HS" | "CTOUR" | "OTHER"; size: number }[] }[] = [];
    for (const p of provinces) {
      if (!p.isDirectory()) continue;
      const dir = path.join(BASE, p.name);
      const files = await fs.readdir(dir, { withFileTypes: true });
      const imgs = files
        .filter((f) => f.isFile() && IMAGE_EXT.has(path.extname(f.name).toLowerCase()))
        .map(async (f) => {
          const st = await fs.stat(path.join(dir, f.name));
          const upper = f.name.toUpperCase();
          const type: "HS" | "CTOUR" | "OTHER" = upper.includes("_HS") ? "HS" : upper.includes("_CTOUR") ? "CTOUR" : "OTHER";
          return { name: f.name, type, size: st.size };
        });
      result.push({ province: p.name, files: (await Promise.all(imgs)).sort((a, b) => a.name.localeCompare(b.name)) });
    }
    result.sort((a, b) => a.province.localeCompare(b.province));
    return NextResponse.json(
      { provinces: result },
      { headers: { "Cache-Control": "public, max-age=300", "X-Content-Type-Options": "nosniff" } },
    );
  } catch {
    return NextResponse.json({ error: "Unable to list geohazard maps" }, { status: 500 });
  }
}

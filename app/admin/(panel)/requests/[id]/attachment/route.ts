import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth";
import { getAccessRequest } from "@/lib/repo";

/**
 * Serve a requester-uploaded supporting document to signed-in staff only.
 *
 * Defences:
 * - session required (staff console)
 * - the stored path must resolve inside data/request-attachments
 * - only PDF/PNG/JPEG are served, with a fixed Content-Type
 * - always sent as an attachment (never rendered inline on our origin)
 * - filename sanitised to strip quotes, CR/LF and control characters
 */

const ATTACHMENT_DIR = path.join(process.cwd(), "data", "request-attachments");

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

function safeDownloadName(name: string, ext: string): string {
  const base = path
    .basename(name)
    // Strip CR/LF, quotes and any other control characters that could break
    // the Content-Disposition header.
    .replace(/[\u0000-\u001f\u007f"\\/]/g, "")
    .trim()
    .slice(0, 150);
  if (!base) return `attachment${ext}`;
  return base;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const requestId = Number(id);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const request = getAccessRequest(requestId);
  if (!request || !request.attachment_path || !request.attachment_name) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Containment check that cannot be fooled by sibling-prefix paths
  // (e.g. .../request-attachments-evil).
  const full = path.resolve(process.cwd(), request.attachment_path);
  const rel = path.relative(ATTACHMENT_DIR, full);
  if (rel === "" || rel.startsWith("..") || path.isAbsolute(rel)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const ext = path.extname(full).toLowerCase();
  const type = CONTENT_TYPES[ext];
  if (!type) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }

  try {
    const data = await readFile(full);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": type,
        "Content-Disposition": `attachment; filename="${safeDownloadName(request.attachment_name, ext)}"`,
        "Content-Length": String(data.byteLength),
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

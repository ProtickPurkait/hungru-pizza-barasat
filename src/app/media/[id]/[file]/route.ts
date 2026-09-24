import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { media } from "@/db/schema";
import { renderIcon } from "@/lib/media/process";
import { readStoredFile } from "@/lib/media/storage";
import { demoModeResponse } from "@/lib/demo-guard";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ICON_SIZES = new Set([32, 48, 180, 192, 512]);

const baseHeaders = {
  "Cache-Control": "public, max-age=31536000, immutable",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; sandbox",
  "Cross-Origin-Resource-Policy": "same-site",
};

/** Serves uploaded media. Files are immutable, so they're cached for a year. Supports Range for video. */
export async function GET(request: NextRequest, ctx: RouteContext<"/media/[id]/[file]">) {
  const unavailable = demoModeResponse();
  if (unavailable) return unavailable;
  const { id, file } = await ctx.params;
  if (!UUID.test(id)) return new NextResponse("Not found", { status: 404 });

  const rows = await db
    .select({ mime: media.mime, kind: media.kind, storage: media.storage, data: media.data, path: media.path })
    .from(media)
    .where(eq(media.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return new NextResponse("Not found", { status: 404 });
  const buffer = await readStoredFile(row);
  if (!buffer) return new NextResponse("Not found", { status: 404 });

  const icon = file.match(/^icon-(\d+)\.png$/);
  if (icon) {
    const size = Number(icon[1]);
    if (row.kind !== "image" || !ICON_SIZES.has(size)) return new NextResponse("Not found", { status: 404 });
    const png = await renderIcon(buffer, size);
    return new NextResponse(new Uint8Array(png), { headers: { ...baseHeaders, "Content-Type": "image/png" } });
  }

  const etag = `"${id}"`;
  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: { ...baseHeaders, ETag: etag } });
  }

  const total = buffer.length;
  const range = request.headers.get("range");
  if (range && row.kind === "video") {
    const match = range.match(/^bytes=(\d*)-(\d*)$/);
    if (match) {
      let start = match[1] ? Number(match[1]) : total - Number(match[2]);
      let end = match[1] && match[2] ? Number(match[2]) : total - 1;
      if (!match[1]) end = total - 1;
      start = Math.max(0, start);
      end = Math.min(end, total - 1);
      if (start > end || start >= total) {
        return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${total}` } });
      }
      return new NextResponse(new Uint8Array(buffer.subarray(start, end + 1)), {
        status: 206,
        headers: {
          ...baseHeaders,
          "Content-Type": row.mime,
          "Content-Length": String(end - start + 1),
          "Content-Range": `bytes ${start}-${end}/${total}`,
          "Accept-Ranges": "bytes",
          ETag: etag,
        },
      });
    }
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      ...baseHeaders,
      "Content-Type": row.mime,
      "Content-Length": String(total),
      "Accept-Ranges": row.kind === "video" ? "bytes" : "none",
      ETag: etag,
    },
  });
}

import { desc, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { media } from "@/db/schema";
import { UserFacingError } from "@/lib/actions";
import { getSession } from "@/lib/auth/session";
import { mediaUrl } from "@/lib/content/media-url";
import { IMAGE_MAX_BYTES, processUpload, VIDEO_MAX_BYTES } from "@/lib/media/process";
import { storeFile } from "@/lib/media/storage";
import { demoModeResponse } from "@/lib/demo-guard";

export const runtime = "nodejs";

const listColumns = {
  id: media.id,
  filename: media.filename,
  mime: media.mime,
  kind: media.kind,
  size: media.size,
  width: media.width,
  height: media.height,
  alt: media.alt,
  blurDataUrl: media.blurDataUrl,
  createdAt: media.createdAt,
};

type ListRow = { id: string; filename: string; mime: string } & Record<string, unknown>;
const withUrl = <T extends ListRow>(row: T) => ({ ...row, url: mediaUrl(row) });

export async function GET(request: NextRequest) {
  const unavailable = demoModeResponse();
  if (unavailable) return unavailable;
  if (!(await getSession())) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const kind = request.nextUrl.searchParams.get("kind");
  const query = db.select(listColumns).from(media).orderBy(desc(media.createdAt)).limit(500);
  const rows = kind === "image" || kind === "video" ? await query.where(eq(media.kind, kind)) : await query;
  return NextResponse.json({ items: rows.map(withUrl) }, { headers: { "Cache-Control": "no-store" } });
}

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true; // same-origin navigations from older browsers
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const unavailable = demoModeResponse();
  if (unavailable) return unavailable;
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Your session expired. Please sign in again." }, { status: 401 });
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > VIDEO_MAX_BYTES + 1024 * 1024) {
    return NextResponse.json({ error: "That file is too large. Images: 10 MB max, videos: 20 MB max." }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  }
  if (file.size > Math.max(IMAGE_MAX_BYTES, VIDEO_MAX_BYTES)) {
    return NextResponse.json({ error: "That file is too large. Images: 10 MB max, videos: 20 MB max." }, { status: 413 });
  }
  const alt = String(form.get("alt") ?? "")
    .trim()
    .slice(0, 200);

  try {
    const processed = await processUpload(Buffer.from(await file.arrayBuffer()));
    const id = crypto.randomUUID();
    const extension = processed.mime.split("/")[1] ?? "bin";
    const location = await storeFile(id, processed.data, extension);
    const filename = file.name.replace(/[^\w.\- ]+/g, "").slice(0, 120) || `upload.${extension}`;
    const [row] = await db
      .insert(media)
      .values({
        id,
        filename,
        mime: processed.mime,
        kind: processed.kind,
        size: processed.data.length,
        width: processed.width,
        height: processed.height,
        alt,
        blurDataUrl: processed.blurDataUrl,
        storage: location.storage,
        data: location.data,
        path: location.path,
        uploadedBy: user.id,
      })
      .returning(listColumns);
    return NextResponse.json({ item: withUrl(row) }, { status: 201 });
  } catch (error) {
    if (error instanceof UserFacingError) return NextResponse.json({ error: error.message }, { status: 422 });
    console.error("[media upload]", error);
    return NextResponse.json({ error: "We couldn't process that file. Try a different image." }, { status: 500 });
  }
}

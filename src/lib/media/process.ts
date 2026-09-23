import "server-only";
import sharp, { type Metadata } from "sharp";
import { UserFacingError } from "@/lib/actions";

export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 20 * 1024 * 1024;
const MAX_DIMENSION = 2000;

export type ProcessedMedia = {
  kind: "image" | "video";
  mime: string;
  data: Buffer;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
};

function sniffVideo(buffer: Buffer): "video/mp4" | "video/webm" | null {
  if (buffer.length > 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = buffer.subarray(8, 12).toString("ascii");
    if (/^(qt  )/.test(brand)) return null; // QuickTime .mov isn't reliably playable in browsers
    return "video/mp4";
  }
  if (buffer.length > 4 && buffer.readUInt32BE(0) === 0x1a45dfa3) return "video/webm";
  return null;
}

/**
 * Validates an upload by its actual content (never the client-supplied type),
 * then optimises images: auto-rotate, strip metadata (incl. GPS), resize, convert to WebP.
 */
export async function processUpload(buffer: Buffer): Promise<ProcessedMedia> {
  const video = sniffVideo(buffer);
  if (video) {
    if (buffer.length > VIDEO_MAX_BYTES) throw new UserFacingError("Videos must be 20 MB or smaller.");
    return { kind: "video", mime: video, data: buffer, width: null, height: null, blurDataUrl: null };
  }

  if (buffer.length > IMAGE_MAX_BYTES) throw new UserFacingError("Images must be 10 MB or smaller.");

  let metadata: Metadata;
  try {
    metadata = await sharp(buffer, { limitInputPixels: 60_000_000 }).metadata();
  } catch {
    throw new UserFacingError("That file isn't a supported image. Use JPG, PNG, WebP, AVIF or GIF.");
  }
  const format = metadata.format;
  if (format === "heif") {
    throw new UserFacingError("iPhone HEIC photos aren't supported yet. Please share/export the photo as JPG and upload again.");
  }
  if (!format || !["jpeg", "png", "webp", "avif", "gif"].includes(format)) {
    throw new UserFacingError("Use a JPG, PNG, WebP, AVIF or GIF image (SVG files aren't accepted for security reasons).");
  }

  const animated = format === "gif" || (metadata.pages ?? 1) > 1;
  const pipeline = sharp(buffer, { animated, limitInputPixels: 60_000_000 })
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 });
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

  const blur = await sharp(data, { animated: false })
    .resize(16, 16, { fit: "inside" })
    .webp({ quality: 40 })
    .toBuffer();

  return {
    kind: "image",
    mime: "image/webp",
    data,
    width: info.width,
    height: animated && info.pageHeight ? info.pageHeight : info.height,
    blurDataUrl: `data:image/webp;base64,${blur.toString("base64")}`,
  };
}

/** Square PNG icon (favicons / apple-touch-icon) generated from an uploaded image. */
export async function renderIcon(source: Buffer, size: number) {
  return sharp(source, { animated: false })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

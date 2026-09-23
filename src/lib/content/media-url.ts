const EXT_BY_MIME: Record<string, string> = {
  "image/webp": "webp",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export function extensionForMime(mime: string) {
  return EXT_BY_MIME[mime] ?? "bin";
}

/** Public URL for an uploaded file. Media is immutable (a new upload gets a new id), so URLs cache forever. */
export function mediaUrl(media: { id: string; filename: string; mime: string }) {
  const base =
    media.filename
      .replace(/\.[a-z0-9]+$/i, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "file";
  return `/media/${media.id}/${base}.${extensionForMime(media.mime)}`;
}

export function mediaIconUrl(mediaId: string, size: number) {
  return `/media/${mediaId}/icon-${size}.png`;
}

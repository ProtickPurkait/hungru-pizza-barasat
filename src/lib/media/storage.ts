import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { serverEnv } from "@/lib/env";

export type StoredLocation = { storage: "db" | "fs"; data: Buffer | null; path: string | null };

function mediaRoot() {
  // Runtime-configured upload folder: not part of the build output.
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), serverEnv.mediaDir());
}

/** Saves a processed file using the configured driver (MEDIA_STORAGE=db|fs). */
export async function storeFile(id: string, data: Buffer, extension: string): Promise<StoredLocation> {
  if (serverEnv.mediaStorage() === "fs") {
    const relative = `${id}.${extension}`;
    await mkdir(mediaRoot(), { recursive: true });
    await writeFile(path.join(/*turbopackIgnore: true*/ mediaRoot(), relative), data);
    return { storage: "fs", data: null, path: relative };
  }
  return { storage: "db", data, path: null };
}

export async function readStoredFile(row: { storage: "db" | "fs"; data: Buffer | null; path: string | null }) {
  if (row.storage === "fs") {
    if (!row.path || row.path.includes("..") || path.isAbsolute(row.path)) return null;
    try {
      return await readFile(path.join(/*turbopackIgnore: true*/ mediaRoot(), row.path));
    } catch {
      return null;
    }
  }
  return row.data;
}

export async function deleteStoredFile(row: { storage: "db" | "fs"; path: string | null }) {
  if (row.storage === "fs" && row.path && !row.path.includes("..")) {
    await rm(path.join(/*turbopackIgnore: true*/ mediaRoot(), row.path), { force: true });
  }
}

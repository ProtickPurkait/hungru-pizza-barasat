export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Returns `base`, or `base-2`, `base-3`… — the first candidate `isTaken` rejects. */
export async function uniqueSlug(base: string, isTaken: (slug: string) => Promise<boolean>) {
  const root = slugify(base) || "item";
  let candidate = root;
  for (let i = 2; await isTaken(candidate); i++) candidate = `${root}-${i}`;
  return candidate;
}

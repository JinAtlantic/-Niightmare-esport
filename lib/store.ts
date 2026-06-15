import "server-only";
import { put, list, del } from "@vercel/blob";
import matches from "@/data/matches.json";
import roster from "@/data/roster.json";
import sponsors from "@/data/sponsors.json";
import news from "@/data/news.json";
import site from "@/data/site.json";

/**
 * Content store. Editable site content lives in a single Vercel Blob
 * (`content/content.json`); the bundled `data/*.json` files are the seed +
 * fallback, so the site always renders even before the blob exists or if the
 * store is unreachable. New deployments ship the latest committed JSON; once
 * the owner edits via the admin, the blob takes over.
 */

export type ContentKey = "matches" | "roster" | "sponsors" | "news" | "site";
export type Content = Record<ContentKey, unknown>;

// Each save writes a NEW, uniquely-named blob (immutable URL) rather than
// overwriting one pathname. Vercel Blob's CDN caches by pathname, so
// overwriting the same name serves stale reads; unique names are always fresh.
const PREFIX = "content/content-";
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

function bundled(): Content {
  // Deep clone so callers can't mutate the imported modules.
  return JSON.parse(JSON.stringify({ matches, roster, sponsors, news, site }));
}

/** True when cloud storage is configured (so the admin can actually save). */
export function storeConfigured(): boolean {
  return Boolean(TOKEN);
}

/** All content blobs, newest first (by upload time). */
async function listVersions() {
  const { blobs } = await list({ prefix: PREFIX, token: TOKEN, limit: 1000 });
  return blobs.sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}

/** Read the full content object — newest blob if present, else the bundled seed. */
export async function readAll(): Promise<Content> {
  if (!TOKEN) return bundled();
  try {
    const versions = await listVersions();
    if (!versions.length) return bundled();
    // The newest version has a unique, immutable URL → always fresh.
    const res = await fetch(versions[0].url, { cache: "no-store" });
    if (!res.ok) return bundled();
    const data = (await res.json()) as Partial<Content>;
    // Merge over the seed so a missing section still falls back cleanly.
    return { ...bundled(), ...data };
  } catch {
    return bundled();
  }
}

async function writeAll(content: Content): Promise<void> {
  if (!TOKEN) {
    throw new Error("Storage not configured (BLOB_READ_WRITE_TOKEN missing)");
  }
  const fresh = await put(`${PREFIX}${Date.now()}.json`, JSON.stringify(content, null, 2), {
    access: "public",
    contentType: "application/json",
    token: TOKEN,
    addRandomSuffix: true,
    cacheControlMaxAge: 31536000, // immutable name → safe to cache hard
  });
  // Best-effort cleanup: drop every older version, keep only the one just written.
  try {
    const { blobs } = await list({ prefix: PREFIX, token: TOKEN, limit: 1000 });
    const stale = blobs.filter((b) => b.url !== fresh.url).map((b) => b.url);
    if (stale.length) await del(stale, { token: TOKEN });
  } catch {
    /* leftover old versions are harmless; next save retries cleanup */
  }
}

export async function readSection(key: ContentKey): Promise<unknown> {
  return (await readAll())[key];
}

export async function writeSection(key: ContentKey, value: unknown): Promise<void> {
  const all = await readAll();
  all[key] = value;
  await writeAll(all);
}

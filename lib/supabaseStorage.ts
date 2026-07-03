import "server-only";
import { getSupabaseAdmin } from "./supabaseAdmin";

/**
 * Image uploads (admin media + customer payment slips) live in a single public
 * Supabase Storage bucket. We moved off Vercel Blob because the free Blob store
 * gets suspended once it hits its usage cap (`limits-exceeded-suspended`), which
 * silently broke every upload. Supabase Storage shares the project we already use
 * for content, so there is no extra service or token to keep alive.
 *
 * The bucket is public-read; the returned URL is stored verbatim (same as the old
 * Blob URLs) and used directly in <img src>.
 */
export const STORAGE_BUCKET = "uploads";

/** Whether image uploads can run (Supabase service role configured). */
export { supabaseAdminEnabled as storageEnabled } from "./supabaseAdmin";

/**
 * Upload bytes to the public bucket and return the public URL. Throws on a
 * misconfiguration or a storage error so callers can decide whether to surface
 * the failure (admin) or swallow it best-effort (customer slip).
 */
export async function uploadToStorage(
  path: string,
  bytes: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Storage not configured");
  const { error } = await db.storage.from(STORAGE_BUCKET).upload(path, bytes, {
    contentType,
    upsert: true,
    cacheControl: "31536000", // images are immutable; cache hard
  });
  if (error) throw new Error(error.message);
  const { data } = db.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Recover the in-bucket path from a public URL produced by `getPublicUrl`
 *  (…/storage/v1/object/public/uploads/<path>). Returns null if this isn't one
 *  of our bucket URLs, so we never try to remove something unexpected. */
export function storagePathFromUrl(url: string): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  const path = url.slice(i + marker.length).split(/[?#]/)[0];
  return path ? decodeURIComponent(path) : null;
}

/** Best-effort delete of an uploaded object, given its public URL (or bare path).
 *  Swallows errors and returns whether it removed something — callers use this
 *  to clean up slips/shipping images when an order is deleted, and shouldn't
 *  fail the whole request if storage cleanup doesn't land. */
export async function deleteFromStorage(urlOrPath: string): Promise<boolean> {
  const db = getSupabaseAdmin();
  if (!db || !urlOrPath) return false;
  const path = urlOrPath.includes("/storage/v1/object/")
    ? storagePathFromUrl(urlOrPath)
    : urlOrPath;
  if (!path) return false;
  try {
    const { error } = await db.storage.from(STORAGE_BUCKET).remove([path]);
    return !error;
  } catch {
    return false;
  }
}

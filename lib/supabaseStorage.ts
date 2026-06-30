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

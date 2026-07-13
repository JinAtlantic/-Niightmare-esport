import "server-only";
import { getSupabaseAdmin } from "./supabaseAdmin";

/** Public website media and private customer/order evidence must never share an
 * access model. Public images keep their stable CDN URL; payment slips and
 * shipping proofs are stored as opaque refs and are exposed only through short
 * lived signed URLs returned by an authorized API route. */
export const STORAGE_BUCKET = "uploads";
export const ORDER_EVIDENCE_BUCKET = "order-evidence";
const PRIVATE_REF_PREFIX = `${ORDER_EVIDENCE_BUCKET}:`;

/** Whether image uploads can run (Supabase service role configured). */
export { supabaseAdminEnabled as storageEnabled } from "./supabaseAdmin";

/** Upload public website media and return its stable public URL. */
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
    cacheControl: "31536000",
  });
  if (error) throw new Error(error.message);
  const { data } = db.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Upload sensitive order evidence and return an internal storage reference,
 * never a reusable public/signed URL. */
export async function uploadOrderEvidence(
  path: string,
  bytes: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Storage not configured");
  const { error } = await db.storage.from(ORDER_EVIDENCE_BUCKET).upload(path, bytes, {
    contentType,
    upsert: false,
    cacheControl: "300",
  });
  if (error) throw new Error(error.message);
  return `${PRIVATE_REF_PREFIX}${path}`;
}

/** Decode and re-encode a customer-supplied raster image. This verifies the
 * actual bytes (not just the data-URL MIME), strips metadata, caps dimensions,
 * and produces one predictable format before private storage. */
export async function normalizeOrderEvidenceImage(
  input: Buffer,
  maxBytes = 4 * 1024 * 1024
): Promise<Buffer | null> {
  try {
    const sharp = (await import("sharp")).default;
    const output = await sharp(input, { failOn: "error", limitInputPixels: 24_000_000 })
      .rotate()
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 88, progressive: true, mozjpeg: true })
      .toBuffer();
    return output.length > 0 && output.length <= maxBytes ? output : null;
  } catch {
    return null;
  }
}

interface StorageLocation {
  bucket: string;
  path: string;
  isPrivate: boolean;
}

/** Parse current private refs and legacy public URLs. Supporting legacy URLs
 * lets the migration and retention job safely clean up pre-hardening files. */
export function storageLocation(value: string): StorageLocation | null {
  if (!value) return null;
  if (value.startsWith(PRIVATE_REF_PREFIX)) {
    const path = value.slice(PRIVATE_REF_PREFIX.length).split(/[?#]/)[0];
    return path ? { bucket: ORDER_EVIDENCE_BUCKET, path, isPrivate: true } : null;
  }

  for (const marker of [
    `/storage/v1/object/public/${STORAGE_BUCKET}/`,
    `/storage/v1/object/sign/${ORDER_EVIDENCE_BUCKET}/`,
  ]) {
    const index = value.indexOf(marker);
    if (index === -1) continue;
    const path = value.slice(index + marker.length).split(/[?#]/)[0];
    if (!path) return null;
    const isPrivate = marker.includes(`/sign/${ORDER_EVIDENCE_BUCKET}/`);
    return {
      bucket: isPrivate ? ORDER_EVIDENCE_BUCKET : STORAGE_BUCKET,
      path: decodeURIComponent(path),
      isPrivate,
    };
  }
  return null;
}

/** Return a short-lived URL for private evidence. Legacy public URLs pass
 * through until the one-off migration moves them into the private bucket. */
export async function signedStorageUrl(
  refOrUrl: string | null | undefined,
  expiresIn = 10 * 60
): Promise<string | null> {
  if (!refOrUrl) return null;
  const location = storageLocation(refOrUrl);
  if (!location) return null;
  if (!location.isPrivate) return refOrUrl;
  const db = getSupabaseAdmin();
  if (!db) return null;
  const { data, error } = await db.storage
    .from(location.bucket)
    .createSignedUrl(location.path, expiresIn);
  return error ? null : data.signedUrl;
}

/** Best-effort removal for either a private ref or a legacy public URL. */
export async function deleteFromStorage(refOrUrl: string): Promise<boolean> {
  const db = getSupabaseAdmin();
  if (!db || !refOrUrl) return false;
  const location = storageLocation(refOrUrl);
  if (!location) return false;
  try {
    const { error } = await db.storage.from(location.bucket).remove([location.path]);
    return !error;
  } catch {
    return false;
  }
}

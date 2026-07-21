import "server-only";
import { randomUUID } from "node:crypto";
import { normalizeOrderEvidenceImage, uploadOrderEvidence } from "./supabaseStorage";

const MAX_INPUT_BYTES = 4 * 1024 * 1024;

export type EvidenceUploadFailure =
  | "invalid_image"
  | "image_too_large"
  | "image_processing_failed"
  | "storage_failed";

export type EvidenceUploadResult =
  | { ok: true; ref: string }
  | { ok: false; reason: EvidenceUploadFailure };

/** Validate actual bytes, normalize to JPEG, and store as private evidence. */
export async function uploadEvidenceDataUrl(
  data: unknown,
  folder: "shop-slips" | "shop-shipping"
): Promise<EvidenceUploadResult> {
  if (typeof data !== "string") return { ok: false, reason: "invalid_image" };
  const match = /^data:image\/(?:png|jpe?g|webp);base64,([\s\S]+)$/i.exec(data);
  if (!match) return { ok: false, reason: "invalid_image" };

  let input: Buffer;
  try {
    input = Buffer.from(match[1], "base64");
  } catch {
    return { ok: false, reason: "invalid_image" };
  }
  if (!input.length) return { ok: false, reason: "invalid_image" };
  if (input.length > MAX_INPUT_BYTES) return { ok: false, reason: "image_too_large" };

  const normalized = await normalizeOrderEvidenceImage(input, MAX_INPUT_BYTES);
  if (!normalized) {
    console.warn(`[order-evidence] ${folder} image normalization failed`);
    return { ok: false, reason: "image_processing_failed" };
  }

  try {
    const ref = await uploadOrderEvidence(
      `${folder}/${randomUUID()}.jpg`,
      normalized,
      "image/jpeg"
    );
    return { ok: true, ref };
  } catch (error) {
    console.error(
      `[order-evidence] ${folder} storage upload failed`,
      error instanceof Error ? error.message : "unknown error"
    );
    return { ok: false, reason: "storage_failed" };
  }
}

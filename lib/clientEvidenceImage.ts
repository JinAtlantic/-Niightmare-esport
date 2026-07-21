import "client-only";

const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 1_500_000;
const STARTING_EDGE = 1600;
const MIN_EDGE = 800;

export type EvidenceImageErrorCode =
  | "source_too_large"
  | "unsupported_image"
  | "processing_failed";

export class EvidenceImageError extends Error {
  constructor(public readonly code: EvidenceImageErrorCode) {
    super(code);
    this.name = "EvidenceImageError";
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new EvidenceImageError("processing_failed"));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new EvidenceImageError("unsupported_image"));
    image.src = src;
  });
}

function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) return Number.POSITIVE_INFINITY;
  const base64 = dataUrl.slice(comma + 1).replace(/=+$/, "");
  return Math.floor((base64.length * 3) / 4);
}

/**
 * Convert payment slips and shipping proofs to a predictable, small JPEG.
 * Always re-encoding is important: a detailed PNG can exceed the API limit even
 * when its pixel dimensions are already below the resize threshold.
 */
export async function prepareEvidenceImage(file: File): Promise<string> {
  if (!file.size || file.size > MAX_SOURCE_BYTES) {
    throw new EvidenceImageError("source_too_large");
  }

  const source = await readAsDataUrl(file);
  const image = await loadImage(source);
  if (!image.naturalWidth || !image.naturalHeight) {
    throw new EvidenceImageError("unsupported_image");
  }

  let edge = Math.min(STARTING_EDGE, Math.max(image.naturalWidth, image.naturalHeight));
  while (edge >= MIN_EDGE) {
    const scale = Math.min(1, edge / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new EvidenceImageError("processing_failed");

    // JPEG has no alpha channel. A white base keeps transparent screenshots legible.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.84, 0.76, 0.68, 0.6]) {
      const output = canvas.toDataURL("image/jpeg", quality);
      if (output.startsWith("data:image/jpeg;base64,") && dataUrlBytes(output) <= MAX_OUTPUT_BYTES) {
        return output;
      }
    }
    edge = Math.floor(edge * 0.75);
  }

  throw new EvidenceImageError("processing_failed");
}

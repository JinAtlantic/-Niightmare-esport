/**
 * Browser-side NSFW image gate for fan avatars. Runs the nsfwjs MobileNetV2
 * model (hosted at /public/nsfw-model) entirely in the visitor's browser, so
 * there is no API key, no per-image cost, and the image never leaves the device
 * until it passes. TensorFlow + the model are dynamically imported so they only
 * load the first time someone actually picks a profile photo.
 *
 * This is a fast first-pass client gate for UX. It is NOT the last line of
 * defence: a determined user can bypass it by calling the upload API directly,
 * so the server re-runs the same model with the same thresholds before any
 * avatar is published (see lib/nsfwServer + app/api/community/profile).
 */

import { evaluateNsfw } from "./nsfwThreshold";

type Prediction = { className: string; probability: number };
type NsfwModel = { classify: (img: HTMLImageElement) => Promise<Prediction[]> };

let modelPromise: Promise<NsfwModel> | null = null;

async function getModel(): Promise<NsfwModel> {
  if (!modelPromise) {
    modelPromise = (async () => {
      const tf = await import("@tensorflow/tfjs");
      await tf.ready();
      const nsfw = await import("nsfwjs");
      const model = await nsfw.load("/nsfw-model/", { size: 224 });
      return model as unknown as NsfwModel;
    })();
  }
  return modelPromise;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image."));
    };
    img.src = url;
  });
}

export interface NsfwResult {
  safe: boolean;
  label: string;
  score: number;
}

/**
 * Classify a picked image. `safe: false` means it looks like porn/hentai, or is
 * strongly suggestive. Thresholds are deliberately a bit strict for avatars.
 */
export async function checkImageSafe(file: File): Promise<NsfwResult> {
  const model = await getModel();
  const img = await loadImage(file);
  try {
    const predictions = await model.classify(img);
    const byClass: Record<string, number> = {};
    for (const p of predictions) byClass[p.className] = p.probability;

    return evaluateNsfw(byClass);
  } finally {
    URL.revokeObjectURL(img.src);
  }
}

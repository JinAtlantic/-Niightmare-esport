import "server-only";
import path from "path";
import { readFile } from "fs/promises";
import { evaluateNsfw, type NsfwVerdict } from "./nsfwThreshold";

/**
 * Authoritative (and only) NSFW gate for fan avatars. It runs on the server so
 * it cannot be bypassed by calling /api/community/profile directly, and so the
 * multi-MB TensorFlow model never has to ship to the browser. Every avatar is
 * classified here (lib/nsfwThreshold) before it is published, and anything that
 * looks unsafe is rejected.
 *
 * How it runs on a serverless function (no native tfjs-node, no browser):
 *   • the model (public/nsfw-model, a Keras layers model) is read straight off
 *     the deployed filesystem through a tiny tf IOHandler — no self-fetch;
 *   • the image is decoded + resized to 224×224 RGB with sharp (already a dep),
 *     then handed to nsfwjs.classify as a plain tensor, which applies the exact
 *     same float normalisation nsfwjs uses in the browser, so verdicts match.
 * The model is cached per warm instance, so only the first call pays the load.
 */

type Prediction = { className: string; probability: number };
type NsfwModel = { classify: (input: unknown) => Promise<Prediction[]> };

const MODEL_DIR = path.join(process.cwd(), "public", "nsfw-model");
const MODEL_SIZE = 224;

let modelPromise: Promise<NsfwModel> | null = null;

/**
 * Minimal tf IOHandler that loads the layers model + its weight shard(s) from
 * disk, so nothing has to be fetched over the network inside the function.
 */
async function fileSystemHandler() {
  const modelJson = JSON.parse(await readFile(path.join(MODEL_DIR, "model.json"), "utf8"));
  const manifest = modelJson.weightsManifest as Array<{ paths: string[]; weights: unknown[] }>;
  const weightSpecs = manifest.flatMap((group) => group.weights);
  const shardPaths = manifest.flatMap((group) => group.paths);

  const buffers = await Promise.all(shardPaths.map((p) => readFile(path.join(MODEL_DIR, p))));
  const total = buffers.reduce((sum, b) => sum + b.byteLength, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const b of buffers) {
    merged.set(b, offset);
    offset += b.byteLength;
  }

  return {
    load: async () => ({
      modelTopology: modelJson.modelTopology,
      weightSpecs,
      weightData: merged.buffer,
    }),
  };
}

async function getModel(): Promise<NsfwModel> {
  if (!modelPromise) {
    modelPromise = (async () => {
      const tf = await import("@tensorflow/tfjs");
      // Force the pure-JS CPU backend; the WebGL backend needs a browser.
      await tf.setBackend("cpu");
      await tf.ready();
      const nsfw = await import("nsfwjs");
      const handler = await fileSystemHandler();
      // No `type` → layers model, matching the browser (lib/nsfwCheck.ts).
      const model = await nsfw.load(handler as never, { size: MODEL_SIZE } as never);
      return model as unknown as NsfwModel;
    })();
    // Let a failed load be retried on the next request instead of caching the error.
    modelPromise.catch(() => {
      modelPromise = null;
    });
  }
  return modelPromise;
}

export type NsfwServerResult = NsfwVerdict;

/**
 * Classify raw avatar bytes. Throws if the model or image decode fails, so the
 * caller can fail closed (reject the upload) rather than publish an unverified
 * photo.
 */
export async function checkAvatarBytesSafe(bytes: Buffer): Promise<NsfwServerResult> {
  const tf = await import("@tensorflow/tfjs");
  const model = await getModel();
  const sharp = (await import("sharp")).default;

  // Decode any supported format (and the first frame of a gif), drop alpha, and
  // resize to the model's input size as a raw RGB buffer.
  const { data, info } = await sharp(bytes, { animated: false })
    .rotate() // honour EXIF orientation
    .removeAlpha()
    .resize(MODEL_SIZE, MODEL_SIZE, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.channels !== 3) throw new Error("unexpected channel count from sharp");

  const tensor = tf.tensor3d(new Int32Array(data), [info.height, info.width, 3], "int32");
  try {
    const predictions = await model.classify(tensor);
    const byClass: Record<string, number> = {};
    for (const p of predictions) byClass[p.className] = p.probability;
    return evaluateNsfw(byClass);
  } finally {
    tensor.dispose();
  }
}

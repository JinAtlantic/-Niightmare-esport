import { randomInt } from "node:crypto";

export const ORDER_REFERENCE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
export const ORDER_REFERENCE_START_LENGTH = 4;

export function orderReferenceCapacity(length: number): bigint {
  return BigInt(ORDER_REFERENCE_ALPHABET.length) ** BigInt(Math.max(1, Math.floor(length)));
}

/** Generate a compact, uppercase order reference using cryptographic randomness. */
export function generateOrderReference(length = ORDER_REFERENCE_START_LENGTH): string {
  const safeLength = Math.max(1, Math.floor(length));
  let reference = "";
  for (let index = 0; index < safeLength; index += 1) {
    reference += ORDER_REFERENCE_ALPHABET[randomInt(ORDER_REFERENCE_ALPHABET.length)];
  }
  return reference;
}

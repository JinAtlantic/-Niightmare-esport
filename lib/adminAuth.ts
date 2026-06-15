import crypto from "crypto";

// These defaults ship in the public repo, so they must never guard a live
// admin. Production stays disabled until BOTH are overridden via env vars.
const DEFAULT_PASSWORD = "niightmare2025";
const DEFAULT_SECRET = "niightmare-dev-secret-change-me";

/** Admin password — read from env, with a dev fallback so it works out of the box. */
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
/** Secret used to sign the session cookie. */
const SECRET = process.env.ADMIN_SECRET || DEFAULT_SECRET;

export const COOKIE_NAME = "nm_admin";

/**
 * The admin now stores content in Vercel Blob, so it can run on the live site.
 * Gating:
 *  - Local dev (`next dev`): always enabled for convenience.
 *  - Production: enabled ONLY when ADMIN_PASSWORD and ADMIN_SECRET are both set
 *    to non-default values. This guarantees a deploy can never expose the admin
 *    with the credentials that are public in the repo.
 */
export const adminDisabled = (): boolean => {
  if (process.env.NODE_ENV === "development") return false;
  const securePw =
    !!process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD !== DEFAULT_PASSWORD;
  const secureSecret =
    !!process.env.ADMIN_SECRET && process.env.ADMIN_SECRET !== DEFAULT_SECRET;
  return !(securePw && secureSecret);
};
/** Session lifetime — 30 days. */
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

/** Create a signed session token (`<issuedAt>.<hmac>`). */
export function makeToken(): string {
  const value = String(Date.now());
  const sig = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  return `${value}.${sig}`;
}

/** Validate a session token: signature must match and it must not be expired. */
export function verifyToken(token?: string | null): boolean {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return false;
  const value = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  if (sig.length !== expected.length) return false;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  } catch {
    return false;
  }
  const issued = Number(value);
  if (!Number.isFinite(issued)) return false;
  return Date.now() - issued <= SESSION_MAX_AGE * 1000;
}

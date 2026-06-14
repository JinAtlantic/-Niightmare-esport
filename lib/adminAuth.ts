import crypto from "crypto";

/** Admin password — read from env, with a dev fallback so it works out of the box. */
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "niightmare2025";
/** Secret used to sign the session cookie. */
const SECRET = process.env.ADMIN_SECRET || "niightmare-dev-secret-change-me";

export const COOKIE_NAME = "nm_admin";
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

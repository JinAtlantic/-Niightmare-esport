import "server-only";
import crypto from "crypto";

// These defaults ship in the public repo, so they must never guard a live
// admin. Production stays disabled until BOTH are overridden via env vars.
const DEFAULT_PASSWORD = "niightmare2025";
const DEFAULT_SECRET = "niightmare-dev-secret-change-me";

/** Admin password, read from env with a dev fallback. */
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
/** Secret used to sign the session cookie. */
const SECRET = process.env.ADMIN_SECRET || DEFAULT_SECRET;
/** Optional base32 TOTP secret. When set, admin login requires a 6 digit code. */
const TOTP_SECRET = process.env.ADMIN_TOTP_SECRET?.trim() || "";

export const COOKIE_NAME = "nm_admin";

/**
 * The admin now stores content in Vercel Blob, so it can run on the live site.
 * Gating:
 *  - Local dev: always enabled for convenience.
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

/** Session lifetime. Long-lived on purpose: once a device logs in, the owner
 *  wants it to stay signed in (no re-entering the password each visit). The
 *  cookie is httpOnly + signed; "Log out" still clears it on demand. */
export const SESSION_MAX_AGE = 365 * 24 * 60 * 60;

export function adminTotpEnabled(): boolean {
  return TOTP_SECRET.length > 0;
}

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

function base32Decode(input: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const normalized = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";

  for (const char of normalized) {
    const value = alphabet.indexOf(char);
    if (value === -1) continue;
    bits += value.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function hotp(secret: Buffer, counter: number): string {
  const msg = Buffer.alloc(8);
  msg.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  msg.writeUInt32BE(counter >>> 0, 4);

  const digest = crypto.createHmac("sha1", secret).update(msg).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, "0");
}

/** Validate a standard 6 digit TOTP code with one step of clock skew tolerance. */
export function verifyTotpCode(code: string): boolean {
  if (!adminTotpEnabled()) return true;
  const normalized = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;

  const secret = base32Decode(TOTP_SECRET);
  if (!secret.length) return false;

  const step = Math.floor(Date.now() / 30_000);
  for (const drift of [-1, 0, 1]) {
    const expected = hotp(secret, step + drift);
    if (crypto.timingSafeEqual(Buffer.from(normalized), Buffer.from(expected))) {
      return true;
    }
  }
  return false;
}

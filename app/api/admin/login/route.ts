import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  ADMIN_PASSWORD,
  COOKIE_NAME,
  SESSION_MAX_AGE,
  adminDisabled,
  adminTotpEnabled,
  makeToken,
  verifyTotpCode,
} from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Best-effort in-memory rate limit. Serverless instances are ephemeral, so this
// is not bulletproof, but it meaningfully slows password guessing per instance.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now > rec.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_ATTEMPTS;
}

function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown"
  );
}

/** Constant-time string compare by hashing both inputs to a fixed length first. */
function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export async function POST(request: Request) {
  if (adminDisabled()) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ip = clientIp(request);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many login attempts. Wait a few minutes and try again." },
      { status: 429 }
    );
  }

  let password = "";
  let totp = "";
  try {
    const body = await request.json();
    password = typeof body?.password === "string" ? body.password : "";
    totp = typeof body?.totp === "string" ? body.totp : "";
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  if (!safeEqual(password, ADMIN_PASSWORD)) {
    return NextResponse.json({ ok: false, error: "Invalid password." }, { status: 401 });
  }

  if (!verifyTotpCode(totp)) {
    return NextResponse.json(
      {
        ok: false,
        error: adminTotpEnabled()
          ? "Invalid two-factor code."
          : "Two-factor authentication is not configured.",
      },
      { status: 401 }
    );
  }

  attempts.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // "lax" (not "strict") so the session cookie is sent on a normal top-level
    // navigation to /admin (a bookmark or a link from a chat app); "strict"
    // withheld it on those, forcing a re-login every time.
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

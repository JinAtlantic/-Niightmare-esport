import { NextResponse } from "next/server";
import { ADMIN_PASSWORD, COOKIE_NAME, SESSION_MAX_AGE, adminDisabled, makeToken } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (adminDisabled()) return NextResponse.json({ error: "Not found" }, { status: 404 });
  let password = "";
  try {
    const body = await request.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { spawn } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { COOKIE_NAME, adminDisabled, verifyToken } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SCOPE = "jinatlantics-projects";
// Portable Node (ships npm/npx) used as a PATH fallback so the deploy works even
// if the dev server wasn't started with it on PATH. Machine-specific — this
// admin only ever runs on the owner's PC.
const NODE_DIR = "C:\\Users\\iTAPE\\AppData\\Local\\nodejs-portable\\node-v22.12.0-win-x64";

export async function POST() {
  if (adminDisabled() || !verifyToken((await cookies()).get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    return NextResponse.json(
      {
        error:
          "ไม่พบ VERCEL_TOKEN — กรุณาเปิดเว็บผ่านไฟล์ลัด “เปิดแอดมิน-NIIGHTMARE” บน Desktop แล้วลองใหม่",
      },
      { status: 400 }
    );
  }

  const env = { ...process.env };
  if (existsSync(NODE_DIR)) env.PATH = NODE_DIR + path.delimiter + (env.PATH || "");

  const args = ["--yes", "vercel@latest", "--prod", "--yes", "--token", token, "--scope", SCOPE];
  const result = await new Promise<{ code: number; out: string }>((resolve) => {
    let out = "";
    const child = spawn("npx", args, { cwd: process.cwd(), env, shell: true });
    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (out += d.toString()));
    child.on("close", (code) => resolve({ code: code ?? 1, out }));
    child.on("error", (e) => resolve({ code: 1, out: out + "\n" + e.message }));
  });

  if (result.code !== 0) {
    const tail = result.out.split("\n").filter(Boolean).slice(-4).join(" | ");
    return NextResponse.json({ error: "Deploy ไม่สำเร็จ: " + (tail || "unknown") }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: "https://niightmareesport.com" });
}

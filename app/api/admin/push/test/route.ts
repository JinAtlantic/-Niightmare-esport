import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, adminDisabled, verifyToken } from "@/lib/adminAuth";
import { pushEnabled, sendPushToAll } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authed(): Promise<boolean> {
  return !adminDisabled() && verifyToken((await cookies()).get(COOKIE_NAME)?.value);
}

export async function POST() {
  if (!(await authed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!pushEnabled) {
    return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า VAPID keys (env)" }, { status: 500 });
  }
  const { sent, pruned } = await sendPushToAll({
    title: "NIIGHTMARE — ทดสอบแจ้งเตือน",
    body: "ถ้าเห็นข้อความนี้ แปลว่าการแจ้งเตือนพร้อมใช้งาน ✅",
    url: "/admin",
    tag: "nm-test",
  });
  return NextResponse.json({ ok: true, sent, pruned });
}

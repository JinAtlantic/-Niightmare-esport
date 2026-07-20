import { NextResponse } from "next/server";
import { cleanupExpiredOrderData } from "@/lib/orderRetention";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type JobStatus = "running" | "succeeded" | "partial" | "failed";

async function recordJobStatus(input: {
  startedAt: string;
  finishedAt: string | null;
  status: JobStatus;
  result?: Record<string, unknown>;
  error?: string | null;
}) {
  const db = getSupabaseAdmin();
  if (!db) return;
  const { error } = await db.from("system_job_status").upsert(
    {
      job_name: "order-retention",
      last_started_at: input.startedAt,
      last_finished_at: input.finishedAt,
      last_status: input.status,
      last_result: input.result ?? {},
      last_error: input.error ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "job_name" }
  );
  // The cleanup result remains authoritative. Audit persistence is best-effort
  // so a temporary logging-table problem never blocks privacy retention.
  if (error) console.error("order-retention audit write failed", error.message);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const startedAt = new Date().toISOString();
  await recordJobStatus({ startedAt, finishedAt: null, status: "running" });
  try {
    const result = await cleanupExpiredOrderData();
    const status = result.failed === 0 ? "succeeded" : "partial";
    await recordJobStatus({
      startedAt,
      finishedAt: new Date().toISOString(),
      status,
      result: { ...result },
    });
    return NextResponse.json(
      { ok: result.failed === 0, ...result },
      { status: result.failed === 0 ? 200 : 207, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Retention cleanup failed";
    await recordJobStatus({
      startedAt,
      finishedAt: new Date().toISOString(),
      status: "failed",
      error: message,
    });
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, adminDisabled, verifyToken } from "@/lib/adminAuth";
import type { MatchScheduleEntry } from "@/lib/matchSchedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ExtractResponse {
  entries?: Partial<MatchScheduleEntry>[];
  warning?: string;
}

function authed(): boolean {
  return !adminDisabled() && verifyToken(cookies().get(COOKIE_NAME)?.value);
}

function readOutputText(json: Record<string, unknown>): string {
  if (typeof json.output_text === "string") return json.output_text;
  const output = Array.isArray(json.output) ? json.output : [];
  for (const item of output) {
    const content = item && typeof item === "object" && "content" in item ? item.content : null;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
        return part.text;
      }
    }
  }
  return "";
}

function normalizeEntries(raw: unknown): MatchScheduleEntry[] {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as ExtractResponse).entries)) {
    return [];
  }
  return ((raw as ExtractResponse).entries ?? []).map((entry, index) => ({
    id: entry.id || `schedule-${Date.now()}-${index}`,
    opponent: entry.opponent ?? "",
    date: entry.date ?? "",
    time: entry.time ?? "",
    round: {
      en: entry.round?.en ?? "",
      lo: entry.round?.lo ?? "",
    },
    note:
      entry.note?.en || entry.note?.lo
        ? { en: entry.note?.en ?? "", lo: entry.note?.lo ?? "" }
        : undefined,
  }));
}

export async function POST(request: Request) {
  if (!authed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { imageUrl?: string };
  try {
    body = (await request.json()) as { imageUrl?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const imageUrl = body.imageUrl?.trim();
  if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
    return NextResponse.json({ error: "Upload a schedule image first." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Schedule image extraction is not configured (OPENAI_API_KEY missing)." },
      { status: 501 }
    );
  }

  const model = process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini";
  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      entries: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            opponent: { type: "string" },
            date: { type: "string", description: "YYYY-MM-DD if visible or confidently inferable, otherwise empty." },
            time: { type: "string", description: "HH:mm 24-hour local time if visible, otherwise empty." },
            round: {
              type: "object",
              additionalProperties: false,
              properties: {
                en: { type: "string" },
                lo: { type: "string" },
              },
              required: ["en", "lo"],
            },
            note: {
              type: "object",
              additionalProperties: false,
              properties: {
                en: { type: "string" },
                lo: { type: "string" },
              },
              required: ["en", "lo"],
            },
          },
          required: ["opponent", "date", "time", "round", "note"],
        },
      },
      warning: { type: "string" },
    },
    required: ["entries", "warning"],
  };

  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  "Read this tournament schedule image. Extract ONLY fixtures involving NIIGHTMARE, NIGHTMARE, NM, or NIIGHTMARE ESPORTS. Return clean editable rows. Do not include other teams' matches. If a value is unclear, leave it empty and mention it in warning. Dates should be YYYY-MM-DD and times HH:mm in the visible local timezone when possible.",
              },
              { type: "input_image", image_url: imageUrl },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "niightmare_schedule",
            strict: true,
            schema,
          },
        },
      }),
    });

    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      const err = json.error && typeof json.error === "object" && "message" in json.error ? String(json.error.message) : "Could not extract schedule.";
      return NextResponse.json({ error: err }, { status: 502 });
    }

    const text = readOutputText(json);
    const parsed = text ? (JSON.parse(text) as ExtractResponse) : {};
    return NextResponse.json({
      entries: normalizeEntries(parsed),
      warning: parsed.warning ?? "",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not extract schedule.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

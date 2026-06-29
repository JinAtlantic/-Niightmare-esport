import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

const PER_MINUTE = 5;
const PER_HOUR = 30;

async function countSince(db: SupabaseClient, table: "player_comments" | "team_comments", userId: string, since: string) {
  const { count, error } = await db
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  if (error) throw error;
  return count ?? 0;
}

export async function checkCommentRateLimit(db: SupabaseClient, userId: string) {
  const now = Date.now();
  const oneMinute = new Date(now - 60 * 1000).toISOString();
  const oneHour = new Date(now - 60 * 60 * 1000).toISOString();

  const [playerMinute, teamMinute, playerHour, teamHour] = await Promise.all([
    countSince(db, "player_comments", userId, oneMinute),
    countSince(db, "team_comments", userId, oneMinute),
    countSince(db, "player_comments", userId, oneHour),
    countSince(db, "team_comments", userId, oneHour),
  ]);

  if (playerMinute + teamMinute >= PER_MINUTE) {
    return { ok: false as const, error: "Too many comments. Please wait a minute and try again." };
  }

  if (playerHour + teamHour >= PER_HOUR) {
    return { ok: false as const, error: "Comment limit reached. Please try again later." };
  }

  return { ok: true as const };
}

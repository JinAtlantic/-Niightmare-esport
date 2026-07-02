import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { publicFanAvatar, publicFanName } from "@/lib/safety";

/** Display name derived from the sign-in identity (Google name, etc.). */
export function defaultDisplayName(user: { user_metadata?: Record<string, unknown> }): string {
  const meta = user.user_metadata ?? {};
  return publicFanName(meta.full_name || meta.name || meta.preferred_username);
}

/** Avatar derived from the sign-in identity (Google picture, etc.). */
export function defaultAvatarUrl(user: { user_metadata?: Record<string, unknown> }): string {
  return publicFanAvatar(user.user_metadata?.avatar_url || user.user_metadata?.picture);
}

/**
 * Create the fan's profile row from their auth identity WITHOUT overwriting an
 * existing (possibly customized) profile. Safe to call on every login/comment —
 * `ignoreDuplicates` makes it an INSERT ... ON CONFLICT DO NOTHING, so a fan who
 * has changed their name/photo keeps it instead of being reset to the Google one.
 */
export async function ensureFanProfileRow(db: SupabaseClient, user: User): Promise<void> {
  await db.from("fan_profiles").upsert(
    {
      id: user.id,
      display_name: defaultDisplayName(user),
      avatar_url: defaultAvatarUrl(user),
      provider: user.app_metadata?.provider ?? null,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );
}

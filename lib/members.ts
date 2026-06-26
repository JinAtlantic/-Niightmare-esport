import { getSupabase } from "./supabase";
import type { GameId, Socials, StaffMember, StaffRole } from "./types";

/**
 * Shape of one row in the Supabase `members` table (snake_case). Kept separate
 * from the app's StaffMember model; map with rowToStaff / staffToRow so the UI
 * keeps using the existing StaffCard / StaffModal / hierarchy logic untouched.
 */
export interface MemberRow {
  id: string;
  name: string | null;
  nickname: string | null;
  official_role: string | null;
  /** Game lineup a coach belongs to ("mlbb" | "efootball"); null = back-office. */
  game: string | null;
  /** Explicit back-office row (1–3); null = infer from official_role. */
  tier: number | null;
  role_en: string | null;
  role_lo: string | null;
  bio_en: string | null;
  bio_lo: string | null;
  country_code: string | null;
  country_en: string | null;
  country_lo: string | null;
  email: string | null;
  photo: string | null;
  facebook: string | null;
  instagram: string | null;
  youtube: string | null;
  tiktok: string | null;
  whatsapp: string | null;
  sort_order: number | null;
}

const SOCIAL_KEYS = ["facebook", "instagram", "youtube", "tiktok", "whatsapp"] as const;

/** Drop empty/whitespace values so optional fields stay truly optional. */
const clean = (v: string | null | undefined) => {
  const t = (v ?? "").trim();
  return t ? t : undefined;
};

export function rowToStaff(row: MemberRow): StaffMember {
  const socials: Socials = {};
  for (const key of SOCIAL_KEYS) {
    const val = clean(row[key]);
    if (val) socials[key] = val;
  }
  return {
    id: row.id,
    name: clean(row.name),
    ign: clean(row.nickname),
    officialRole: (clean(row.official_role) as StaffRole) || undefined,
    game: (clean(row.game) as GameId) || undefined,
    tier: row.tier === 1 || row.tier === 2 || row.tier === 3 ? row.tier : undefined,
    role: { en: row.role_en ?? "", lo: row.role_lo ?? "" },
    bio: row.bio_en || row.bio_lo ? { en: row.bio_en ?? "", lo: row.bio_lo ?? "" } : undefined,
    countryCode: clean(row.country_code),
    country: row.country_en || row.country_lo ? { en: row.country_en ?? "", lo: row.country_lo ?? "" } : undefined,
    email: clean(row.email),
    photo: clean(row.photo),
    socials,
  };
}

export function staffToRow(member: StaffMember, sortOrder?: number): MemberRow {
  const s = member.socials ?? {};
  return {
    id: member.id,
    name: member.name ?? null,
    nickname: member.ign ?? null,
    official_role: member.officialRole ?? null,
    game: member.game ?? null,
    tier: member.tier ?? null,
    role_en: member.role?.en ?? null,
    role_lo: member.role?.lo ?? null,
    bio_en: member.bio?.en ?? null,
    bio_lo: member.bio?.lo ?? null,
    country_code: member.countryCode?.trim().toUpperCase() || null,
    country_en: member.country?.en ?? null,
    country_lo: member.country?.lo ?? null,
    email: member.email ?? null,
    photo: member.photo ?? null,
    facebook: s.facebook ?? null,
    instagram: s.instagram ?? null,
    youtube: s.youtube ?? null,
    tiktok: s.tiktok ?? null,
    whatsapp: s.whatsapp ?? null,
    sort_order: sortOrder ?? null,
  };
}

/**
 * Load the management roster from Supabase. Returns null when Supabase isn't
 * configured or the request fails, signalling the caller to fall back to the
 * bundled content (so guests always see a working page).
 */
export async function fetchMembers(): Promise<StaffMember[] | null> {
  const db = getSupabase();
  if (!db) return null;
  const { data, error } = await db
    .from("members")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error || !data) return null;
  return (data as MemberRow[]).map(rowToStaff);
}

export interface SaveResult {
  ok: boolean;
  persisted: boolean;
  error?: string;
}

/**
 * Save one member through the gated server route (`/api/admin/members`), which
 * checks the admin cookie and writes with the service role. Reads use the anon
 * key directly; writes never do. `persisted:false` (not an error) means Supabase
 * isn't configured yet — the caller updates the UI locally and says so.
 */
export async function saveMember(member: StaffMember): Promise<SaveResult> {
  try {
    const res = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(member),
    });
    const json = await res.json().catch(() => ({}));
    if (res.status === 401) {
      return { ok: false, persisted: false, error: "Your admin session expired. Sign in again." };
    }
    if (!res.ok) {
      return { ok: false, persisted: false, error: json?.error || "Couldn't save. Try again." };
    }
    return { ok: true, persisted: Boolean(json?.persisted) };
  } catch {
    return { ok: false, persisted: false, error: "Network error. Check your connection." };
  }
}

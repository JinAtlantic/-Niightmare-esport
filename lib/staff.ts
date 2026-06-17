import type { Bilingual, StaffMember, StaffRole } from "./types";

export type StaffTier = 1 | 2 | 3;

/** Tier each official role belongs to (1 = executive, 2 = operations, 3 = technical/support). */
export const STAFF_ROLE_TIER: Record<StaffRole, StaffTier> = {
  owner: 1,
  founder: 1,
  ceo: 1,
  manager: 2,
  head_coach: 2,
  coach: 2,
  analyst: 2,
  developer: 3,
  designer: 3,
  content: 3,
  other: 3,
};

/** Official roles in display order, with the canonical bilingual label for each. */
export const STAFF_ROLES: { value: StaffRole; label: Bilingual }[] = [
  { value: "owner", label: { en: "Owner", lo: "ເຈົ້າຂອງ" } },
  { value: "founder", label: { en: "Founder", lo: "ຜູ້ກໍ່ຕັ້ງ" } },
  { value: "ceo", label: { en: "CEO", lo: "ຊີອີໂອ" } },
  { value: "manager", label: { en: "Team Manager", lo: "ຜູ້ຈັດການທີມ" } },
  { value: "head_coach", label: { en: "Head Coach", lo: "ຫົວໜ້າຄູຝຶກ" } },
  { value: "coach", label: { en: "Coach", lo: "ຄູຝຶກ" } },
  { value: "analyst", label: { en: "Analyst", lo: "ນັກວິເຄາະ" } },
  { value: "developer", label: { en: "Website Developer", lo: "ນັກພັດທະນາເວັບໄຊ້ທ໌" } },
  { value: "designer", label: { en: "Designer", lo: "ນັກອອກແບບ" } },
  { value: "content", label: { en: "Content Creator", lo: "ຄອນເທັນຄຣິເອເຕີ" } },
  { value: "other", label: { en: "Crew", lo: "ທີມງານ" } },
];

/**
 * Best-effort tier for legacy staff entries that predate the `officialRole`
 * field, inferred from the English display role. Anything unmatched lands in
 * the support tier so nobody silently disappears from the page.
 */
function inferRole(roleEn = ""): StaffRole {
  const r = roleEn.toLowerCase();
  if (/(owner|เจ้าของ|founder|co-?found)/.test(r)) return "owner";
  if (/(ceo|chief exec|president|director)/.test(r)) return "ceo";
  if (/manager/.test(r)) return "manager";
  if (/head\s*coach/.test(r)) return "head_coach";
  if (/coach/.test(r)) return "coach";
  if (/analy/.test(r)) return "analyst";
  if (/(develop|engineer|programmer|web)/.test(r)) return "developer";
  if (/(design|art|graphic)/.test(r)) return "designer";
  if (/(content|editor|media|social|stream|caster)/.test(r)) return "content";
  return "other";
}

/** Resolve a member's official role, inferring it from the display role when unset. */
export function staffRoleKey(member: StaffMember): StaffRole {
  return member.officialRole ?? inferRole(member.role?.en);
}

/** Tier (1–3) the member sits in within the management hierarchy. */
export function staffTier(member: StaffMember): StaffTier {
  return STAFF_ROLE_TIER[staffRoleKey(member)];
}

/**
 * Split staff into the three hierarchy tiers, preserving the admin-defined
 * order within each tier. Empty tiers are dropped by the caller.
 */
export function groupStaffByTier(staff: StaffMember[]): Record<StaffTier, StaffMember[]> {
  const groups: Record<StaffTier, StaffMember[]> = { 1: [], 2: [], 3: [] };
  for (const member of staff) groups[staffTier(member)].push(member);
  return groups;
}

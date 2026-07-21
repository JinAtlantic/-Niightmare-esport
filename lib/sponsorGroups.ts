import type { Bilingual, SponsorGroup } from "./types";

interface SponsorGroupCopy {
  id: SponsorGroup;
  label: Bilingual;
  eyebrow: Bilingual;
  empty: Bilingual;
  adminLabel: string;
}

/** Display order and shared copy for every public/admin sponsor group. */
export const SPONSOR_GROUPS: readonly SponsorGroupCopy[] = [
  {
    id: "official",
    label: { en: "OFFICIAL SPONSORS", lo: "ຜູ້ສະໜັບສະໜູນທາງການ" },
    eyebrow: { en: "Official Sponsor", lo: "ຜູ້ສະໜັບສະໜູນທາງການ" },
    empty: { en: "No official sponsors yet.", lo: "ຍັງບໍ່ມີຜູ້ສະໜັບສະໜູນທາງການ" },
    adminLabel: "สปอนเซอร์ทางการ",
  },
  {
    id: "event",
    label: { en: "EVENT SPONSORS", lo: "ຜູ້ສະໜັບສະໜູນສະເພາະງານ" },
    eyebrow: { en: "Event Sponsor", lo: "ຜູ້ສະໜັບສະໜູນສະເພາະງານ" },
    empty: { en: "No event sponsors yet.", lo: "ຍັງບໍ່ມີຜູ້ສະໜັບສະໜູນສະເພາະງານ" },
    adminLabel: "สปอนเซอร์เฉพาะงาน",
  },
  {
    id: "past",
    label: { en: "PAST PARTNERS", lo: "ພາດເນີ້ທີ່ເຄີຍຮ່ວມງານ" },
    eyebrow: { en: "Past Partner", lo: "ພາດເນີ້ທີ່ເຄີຍຮ່ວມງານ" },
    empty: { en: "No past partners yet.", lo: "ຍັງບໍ່ມີພາດເນີ້ທີ່ເຄີຍຮ່ວມງານ" },
    adminLabel: "สปอนเซอร์ที่เคยร่วมงาน",
  },
] as const;

export function resolveSponsorGroup(value: unknown): SponsorGroup {
  return value === "event" || value === "past" ? value : "official";
}

export function sponsorGroupCopy(value: unknown): SponsorGroupCopy {
  const group = resolveSponsorGroup(value);
  return SPONSOR_GROUPS.find((item) => item.id === group) ?? SPONSOR_GROUPS[0];
}

import { DEFAULT_SHOP, resolveShop, type ShopContent } from "@/lib/shop";
import type { Player, Sponsor, StaffMember } from "@/lib/types";

export type ReadinessLevel = "ready" | "warning" | "blocked";
export type ReadinessTarget = "shop" | "sponsors" | "roster";

export interface ReadinessCheck {
  id: string;
  title: string;
  detail: string;
  level: ReadinessLevel;
  target: ReadinessTarget;
}

export interface LaunchReadiness {
  level: ReadinessLevel;
  checks: ReadinessCheck[];
  readyCount: number;
  actionCount: number;
}

interface RosterReadinessInput {
  mlbb?: { players?: Player[] };
  efootball?: { players?: Player[] };
  staff?: StaffMember[];
}

interface BuildLaunchReadinessInput {
  shop?: Partial<ShopContent> | null;
  sponsors?: Sponsor[];
  roster?: RosterReadinessInput;
  vapidPublicKey?: string;
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasUsableContactUrl(value: unknown): boolean {
  if (!hasText(value)) return false;
  try {
    const url = new URL(value);
    return ["https:", "http:", "mailto:", "tel:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function hasRealAccountNumber(value: unknown): boolean {
  if (!hasText(value)) return false;
  const compact = value.replace(/[^a-z0-9]/gi, "").toLowerCase();
  const defaultCompact = DEFAULT_SHOP.bank.accountNumber.replace(/[^a-z0-9]/gi, "").toLowerCase();
  if (compact.length < 6 || compact === defaultCompact) return false;
  return !/^(.)\1+$/.test(compact);
}

function hasValidVapidPublicKey(value: unknown): boolean {
  if (!hasText(value)) return false;
  return /^[A-Za-z0-9_-]{80,100}$/.test(value.trim());
}

function check(
  id: string,
  title: string,
  ready: boolean,
  readyDetail: string,
  missingDetail: string,
  target: ReadinessTarget,
  missingLevel: Exclude<ReadinessLevel, "ready">
): ReadinessCheck {
  return {
    id,
    title,
    detail: ready ? readyDetail : missingDetail,
    level: ready ? "ready" : missingLevel,
    target,
  };
}

export function buildLaunchReadiness({
  shop: rawShop,
  sponsors = [],
  roster = {},
  vapidPublicKey = "",
}: BuildLaunchReadinessInput): LaunchReadiness {
  const shop = resolveShop(rawShop);
  const missingBankFields = [
    !hasText(shop.bank.qrImage) ? "QR" : "",
    !hasText(shop.bank.bankName) ? "ชื่อธนาคาร" : "",
    !hasText(shop.bank.accountName) ? "ชื่อบัญชี" : "",
    !hasRealAccountNumber(shop.bank.accountNumber) ? "เลขบัญชีจริง" : "",
  ].filter(Boolean);

  const missingJerseySides = [
    !hasText(shop.frontImage) ? "ด้านหน้า" : "",
    !hasText(shop.backImage) ? "ด้านหลัง" : "",
  ].filter(Boolean);

  const missingSponsorLogos = sponsors.filter((sponsor) => !hasText(sponsor.logo));
  const players = [
    ...(roster.mlbb?.players ?? []),
    ...(roster.efootball?.players ?? []),
  ];
  const missingPlayerPhotos = players.filter((player) => !hasText(player.photo)).length;
  const staff = roster.staff ?? [];
  const missingStaffPhotos = staff.filter((member) => !hasText(member.photo)).length;
  const missingRosterPhotos = missingPlayerPhotos + missingStaffPhotos;

  const checks: ReadinessCheck[] = [
    check(
      "bank",
      "ข้อมูลรับเงิน",
      missingBankFields.length === 0,
      "มี QR และข้อมูลบัญชีพร้อมรับชำระ",
      `ยังขาด ${missingBankFields.join(", ")}`,
      "shop",
      "blocked"
    ),
    check(
      "contact",
      "ช่องทางติดต่อลูกค้า",
      hasUsableContactUrl(rawShop?.contactUrl),
      "ลิงก์ Ask for more info ใช้งานได้",
      "ยังไม่ได้บันทึกลิงก์ติดต่อจริง หรือรูปแบบลิงก์ไม่ถูกต้อง",
      "shop",
      "blocked"
    ),
    check(
      "jersey-images",
      "รูปเสื้อสินค้า",
      missingJerseySides.length === 0,
      "มีรูปเสื้อครบทั้งด้านหน้าและด้านหลัง",
      `ยังขาดรูป${missingJerseySides.join(" และ ")}`,
      "shop",
      "warning"
    ),
    check(
      "sponsor-logos",
      "โลโก้สปอนเซอร์",
      sponsors.length > 0 && missingSponsorLogos.length === 0,
      `มีโลโก้ครบ ${sponsors.length} พาร์ตเนอร์`,
      sponsors.length === 0
        ? "ยังไม่มีรายชื่อพาร์ตเนอร์"
        : `ยังขาด ${missingSponsorLogos.length} จาก ${sponsors.length} โลโก้`,
      "sponsors",
      "warning"
    ),
    check(
      "roster-photos",
      "รูปผู้เล่นและทีมงาน",
      players.length + staff.length > 0 && missingRosterPhotos === 0,
      `มีรูปครบ ${players.length + staff.length} คน`,
      players.length + staff.length === 0
        ? "ยังไม่มีรายชื่อผู้เล่นหรือทีมงาน"
        : `ยังขาดรูปผู้เล่น ${missingPlayerPhotos} คน และทีมงาน ${missingStaffPhotos} คน`,
      "roster",
      "warning"
    ),
    check(
      "web-push",
      "แจ้งเตือนออเดอร์",
      hasValidVapidPublicKey(vapidPublicKey),
      "พบ VAPID public key แล้ว — ทดสอบอุปกรณ์ในแถบแจ้งเตือนด้านบนอีกครั้ง",
      "ยังไม่พบ VAPID public key ใน build นี้ จึงรับ Web Push ไม่ได้",
      "shop",
      "blocked"
    ),
  ];

  const level: ReadinessLevel = checks.some((item) => item.level === "blocked")
    ? "blocked"
    : checks.some((item) => item.level === "warning")
      ? "warning"
      : "ready";

  return {
    level,
    checks,
    readyCount: checks.filter((item) => item.level === "ready").length,
    actionCount: checks.filter((item) => item.level !== "ready").length,
  };
}

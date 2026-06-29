import type { Bilingual, Lang } from "@/lib/types";

/**
 * Shop / 3D Jersey configuration. Admin-editable via site.shop and stored in
 * site_settings.shop (single jsonb blob — same pattern as site.aboutUs /
 * site.roadmap). One jersey, one edition: every shirt carries the official
 * NIIGHTMARE ESPORTS name + number 7 (reserved, non-customisable). Buyers order
 * straight on the site and pay by bank transfer (QR).
 */

export type ShopGender = "male" | "female";

/** One garment size row. Measurements are centimetres; surcharge is in the shop currency. */
export interface ShopSize {
  id: string;
  label: string;
  chest: number;
  length: number;
  shoulder: number;
  sleeve: number;
  minHeight: number;
  maxHeight: number;
  /** Extra charge added to the base price for this size (0 for S–XXL). */
  surcharge: number;
  inStock: boolean;
}

/** Bank-transfer details shown in the payment popup. Admin-editable. */
export interface ShopBank {
  bankName: string;
  accountName: string;
  accountNumber: string;
  /** Path/URL to the bank QR image. */
  qrImage?: string;
  note: Bilingual;
}

export interface ShopContent {
  /** Master switch — when false the page shows a "coming soon" state. */
  enabled: boolean;
  /** Pre-order vs ready-to-ship messaging. */
  preorder: boolean;
  productName: Bilingual;
  tagline: Bilingual;
  description: Bilingual;
  /** Reserved-rights note: name + number are fixed and cannot be changed. */
  rightsNote: Bilingual;
  /** Currency label shown next to prices (e.g. "ກີບ", "LAK"). */
  currency: string;
  /** Base unit price (S–XXL). */
  price: number;
  /** Locked back-of-jersey name (reserved). */
  fixedJerseyName: string;
  /** Locked jersey number (reserved). */
  fixedJerseyNumber: string;
  sizes: ShopSize[];
  /** Courier options for the order form dropdown. */
  couriers: string[];
  bank: ShopBank;
  /** "Ask for more info" contact link (LINE/Facebook/etc.). */
  contactUrl: string;
  /** Optional flat product image path used as a poster/fallback. */
  productImage?: string;
}

export const DEFAULT_SHOP: ShopContent = {
  enabled: true,
  preorder: true,
  productName: { en: "NIIGHTMARE 2026 Official Jersey", lo: "ເສື້ອທີມ NIIGHTMARE 2026 ທາງການ" },
  tagline: {
    en: "Wear the nightmare. Forged for the Lao faithful.",
    lo: "ສວມໃສ່ຄວາມເປັນ NIIGHTMARE. ສ້າງມາເພື່ອແຟນຄັບລາວ.",
  },
  description: {
    en: "The official 2026 competition jersey — breathable sublimated fabric in the Premium Violet Void colourway. Spin the model, pick your size, and order straight here.",
    lo: "ເສື້ອແຂ່ງຂັນທາງການປີ 2026 — ຜ້າພິມລາຍລະບາຍອາກາດດີ ໃນໂທນສີ Premium Violet Void. ໝຸນເບິ່ງໂມເດລ, ເລືອກໄຊ້ ແລະ ສັ່ງຊື້ໄດ້ເລີຍບ່ອນນີ້.",
  },
  rightsNote: {
    en: "Every jersey is printed with the official NIIGHTMARE ESPORTS name and number 7. The club reserves these — the printed name and number cannot be changed.",
    lo: "ເສື້ອທຸກໂຕຈະພິມຊື່ NIIGHTMARE ESPORTS ແລະ ເບີ 7 ຢ່າງເປັນທາງການ. ສະໂມສອນຂໍສະຫງວນລິຂະສິດ — ບໍ່ສາມາດປ່ຽນຊື່ ຫຼື ເບີເສື້ອໄດ້.",
  },
  currency: "ກີບ",
  price: 329000,
  fixedJerseyName: "NIIGHTMARE ESPORTS",
  fixedJerseyNumber: "7",
  sizes: [
    { id: "s", label: "S", chest: 96, length: 68, shoulder: 42, sleeve: 20, minHeight: 155, maxHeight: 165, surcharge: 0, inStock: true },
    { id: "m", label: "M", chest: 102, length: 70, shoulder: 44, sleeve: 21, minHeight: 163, maxHeight: 172, surcharge: 0, inStock: true },
    { id: "l", label: "L", chest: 108, length: 72, shoulder: 46, sleeve: 22, minHeight: 170, maxHeight: 178, surcharge: 0, inStock: true },
    { id: "xl", label: "XL", chest: 114, length: 74, shoulder: 48, sleeve: 23, minHeight: 176, maxHeight: 185, surcharge: 0, inStock: true },
    { id: "xxl", label: "XXL", chest: 120, length: 76, shoulder: 50, sleeve: 24, minHeight: 183, maxHeight: 192, surcharge: 0, inStock: true },
    { id: "3xl", label: "3XL", chest: 126, length: 78, shoulder: 52, sleeve: 25, minHeight: 188, maxHeight: 196, surcharge: 10000, inStock: true },
    { id: "4xl", label: "4XL", chest: 132, length: 80, shoulder: 54, sleeve: 26, minHeight: 192, maxHeight: 200, surcharge: 20000, inStock: true },
  ],
  couriers: ["Anousith Express", "Mixay Express", "HAL Logistics", "Houb Logistics", "BCEL Express", "Other"],
  bank: {
    bankName: "BCEL",
    accountName: "NIIGHTMARE ESPORTS",
    accountNumber: "000-00-00-00000000-000",
    qrImage: "",
    note: {
      en: "Scan the QR or transfer to the account above, then tap “I've transferred”.",
      lo: "ສະແກນ QR ຫຼື ໂອນເຂົ້າບັນຊີຂ້າງເທິງ ແລ້ວກົດ “ໂອນເງິນແລ້ວ”.",
    },
  },
  contactUrl: "https://m.me/niightmareesports",
  productImage: "",
};

/** Wearer height bounds the slider is clamped to (cm). */
export const SHOP_HEIGHT_MIN = 150;
export const SHOP_HEIGHT_MAX = 200;
export const SHOP_HEIGHT_DEFAULT = 172;
export const SHOP_QTY_MAX = 50;

const mergeBi = (fallback: Bilingual, raw?: Partial<Bilingual> | null): Bilingual => ({
  en: raw?.en ?? fallback.en,
  lo: raw?.lo ?? fallback.lo,
});

const num = (raw: unknown, fallback: number): number => {
  const n = typeof raw === "string" ? Number(raw) : (raw as number);
  return Number.isFinite(n) ? (n as number) : fallback;
};

function mergeSize(fallback: ShopSize, raw?: Partial<ShopSize> | null): ShopSize {
  return {
    id: raw?.id ?? fallback.id,
    label: (raw?.label ?? fallback.label) || fallback.label,
    chest: num(raw?.chest, fallback.chest),
    length: num(raw?.length, fallback.length),
    shoulder: num(raw?.shoulder, fallback.shoulder),
    sleeve: num(raw?.sleeve, fallback.sleeve),
    minHeight: num(raw?.minHeight, fallback.minHeight),
    maxHeight: num(raw?.maxHeight, fallback.maxHeight),
    surcharge: num(raw?.surcharge, fallback.surcharge),
    inStock: typeof raw?.inStock === "boolean" ? raw.inStock : fallback.inStock,
  };
}

/** Merge saved (partial) shop content over the defaults so a partial site.shop renders cleanly. */
export function resolveShop(raw?: Partial<ShopContent> | null): ShopContent {
  const rawSizes = Array.isArray(raw?.sizes) ? raw!.sizes : null;
  const sizes =
    rawSizes && rawSizes.length
      ? rawSizes.map((sz, i) => mergeSize(DEFAULT_SHOP.sizes[i] ?? DEFAULT_SHOP.sizes[0], sz))
      : DEFAULT_SHOP.sizes;

  const couriers =
    Array.isArray(raw?.couriers) && raw!.couriers.filter((c) => c && c.trim()).length
      ? raw!.couriers.filter((c) => c && c.trim())
      : DEFAULT_SHOP.couriers;

  return {
    enabled: typeof raw?.enabled === "boolean" ? raw.enabled : DEFAULT_SHOP.enabled,
    preorder: typeof raw?.preorder === "boolean" ? raw.preorder : DEFAULT_SHOP.preorder,
    productName: mergeBi(DEFAULT_SHOP.productName, raw?.productName),
    tagline: mergeBi(DEFAULT_SHOP.tagline, raw?.tagline),
    description: mergeBi(DEFAULT_SHOP.description, raw?.description),
    rightsNote: mergeBi(DEFAULT_SHOP.rightsNote, raw?.rightsNote),
    currency: (raw?.currency ?? DEFAULT_SHOP.currency) || DEFAULT_SHOP.currency,
    price: num(raw?.price, DEFAULT_SHOP.price),
    fixedJerseyName: (raw?.fixedJerseyName ?? DEFAULT_SHOP.fixedJerseyName) || DEFAULT_SHOP.fixedJerseyName,
    fixedJerseyNumber: (raw?.fixedJerseyNumber ?? DEFAULT_SHOP.fixedJerseyNumber) || DEFAULT_SHOP.fixedJerseyNumber,
    sizes,
    couriers,
    bank: {
      bankName: raw?.bank?.bankName ?? DEFAULT_SHOP.bank.bankName,
      accountName: raw?.bank?.accountName ?? DEFAULT_SHOP.bank.accountName,
      accountNumber: raw?.bank?.accountNumber ?? DEFAULT_SHOP.bank.accountNumber,
      qrImage: raw?.bank?.qrImage || undefined,
      note: mergeBi(DEFAULT_SHOP.bank.note, raw?.bank?.note),
    },
    contactUrl: raw?.contactUrl ?? DEFAULT_SHOP.contactUrl,
    productImage: raw?.productImage || undefined,
  };
}

/* ── Pricing ──────────────────────────────────────────────────────────────── */

export function sizePrice(content: ShopContent, size: ShopSize | undefined): number {
  return content.price + (size?.surcharge ?? 0);
}

export function formatPrice(amount: number, currency: string): string {
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString("en-US")} ${currency}`;
}

/* ── Fit model (for the 3D viewer) ──────────────────────────────────────────
 * Anthropometric approximation purely for fit *visualisation* — not a sizing
 * tool. Body chest circumference is estimated from height + gender, then
 * compared against the garment chest to judge the drape. */

export interface BodyMetrics {
  chest: number;
  shoulder: number;
  torso: number;
  hip: number;
}

export function bodyMetrics(heightCm: number, gender: ShopGender): BodyMetrics {
  const h = clamp(heightCm, SHOP_HEIGHT_MIN, SHOP_HEIGHT_MAX);
  if (gender === "female") {
    return { chest: h * 0.525, shoulder: h * 0.225, torso: h * 0.30, hip: h * 0.215 };
  }
  return { chest: h * 0.55, shoulder: h * 0.255, torso: h * 0.305, hip: h * 0.20 };
}

export type FitLevel = "tight" | "fitted" | "regular" | "relaxed" | "oversized";

export interface FitAssessment {
  level: FitLevel;
  label: Bilingual;
  ease: number;
  looseness: number;
  tone: "loss" | "win" | "glow";
}

const FIT_LABELS: Record<FitLevel, Bilingual> = {
  tight: { en: "Tight", lo: "ຄັບ" },
  fitted: { en: "Fitted", lo: "ພໍດີຕົວ" },
  regular: { en: "Regular", lo: "ພໍດີ" },
  relaxed: { en: "Relaxed", lo: "ຫຼວມສະບາຍ" },
  oversized: { en: "Oversized", lo: "ໃຫຍ່ໂອເວີ" },
};

export function fitAssessment(size: ShopSize, heightCm: number, gender: ShopGender): FitAssessment {
  const body = bodyMetrics(heightCm, gender);
  const ease = size.chest - body.chest;
  let level: FitLevel;
  if (ease < 2) level = "tight";
  else if (ease < 9) level = "fitted";
  else if (ease < 17) level = "regular";
  else if (ease < 25) level = "relaxed";
  else level = "oversized";

  const looseness = clamp((ease - 2) / 28, 0, 1);
  const tone: FitAssessment["tone"] =
    level === "tight" || level === "oversized" ? "loss" : level === "regular" ? "win" : "glow";

  return { level, label: FIT_LABELS[level], ease, looseness, tone };
}

export function recommendSize(sizes: ShopSize[], heightCm: number, gender: ShopGender): ShopSize | null {
  const inStock = sizes.filter((s) => s.inStock);
  const pool = inStock.length ? inStock : sizes;
  if (!pool.length) return null;
  const body = bodyMetrics(heightCm, gender);
  const TARGET_EASE = 12;
  return pool.reduce((best, s) =>
    Math.abs(s.chest - body.chest - TARGET_EASE) < Math.abs(best.chest - body.chest - TARGET_EASE) ? s : best
  );
}

/* ── Order ────────────────────────────────────────────────────────────────── */

export interface ShopOrderInput {
  quantity: number;
  sizeId: string;
  customerName: string;
  phone: string;
  courier: string;
  province: string;
  city: string;
  branch: string;
}

export interface ShopOrderRecord extends ShopOrderInput {
  id?: string;
  sizeLabel: string;
  unitPrice: number;
  total: number;
  currency: string;
  createdAt?: string;
  status?: string;
}

/** Validate the order form. Returns a map of field → error key (empty = valid). */
export function validateOrder(input: ShopOrderInput): Partial<Record<keyof ShopOrderInput, boolean>> {
  const errors: Partial<Record<keyof ShopOrderInput, boolean>> = {};
  if (!(input.quantity >= 1)) errors.quantity = true;
  if (!input.sizeId) errors.sizeId = true;
  if (!input.customerName.trim()) errors.customerName = true;
  if (!input.phone.trim()) errors.phone = true;
  if (!input.courier.trim()) errors.courier = true;
  if (!input.province.trim()) errors.province = true;
  if (!input.city.trim()) errors.city = true;
  if (!input.branch.trim()) errors.branch = true;
  return errors;
}

/** Plain-text order summary for the team (email / contact). */
export function buildOrderMessage(content: ShopContent, order: ShopOrderRecord, lang: Lang): string {
  const L =
    lang === "lo"
      ? { head: "ສັ່ງຊື້ເສື້ອ NIIGHTMARE", product: "ສິນຄ້າ", size: "ໄຊ້", qty: "ຈຳນວນ", name: "ຊື່ຜູ້ສັ່ງ", phone: "ເບີໂທ/WhatsApp", ship: "ຂົນສົ່ງ", total: "ລາຄາລວມ" }
      : { head: "NIIGHTMARE jersey order", product: "Product", size: "Size", qty: "Quantity", name: "Customer", phone: "Phone/WhatsApp", ship: "Delivery", total: "Total" };
  return [
    L.head,
    `${L.product}: ${content.productName[lang] ?? content.productName.en}`,
    `${L.size}: ${order.sizeLabel}`,
    `${L.qty}: ${order.quantity}`,
    `${L.name}: ${order.customerName}`,
    `${L.phone}: ${order.phone}`,
    `${L.ship}: ${order.courier} · ${order.province} · ${order.city} · ${order.branch}`,
    `${L.total}: ${formatPrice(order.total, order.currency)}`,
  ].join("\n");
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

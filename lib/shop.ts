import type { Bilingual, Lang } from "@/lib/types";

/**
 * Shop / 3D Jersey configuration. Admin-editable via site.shop and stored in
 * site_settings.shop (single jsonb blob — same pattern as site.aboutUs /
 * site.roadmap). Everything the public Shop page needs — copy, price, stock,
 * size chart, order channels — lives here so it renders fully before anything
 * is ever saved in the admin.
 */

export type ShopGender = "male" | "female";
/** Fan = name locked to the team wordmark; Player = custom name allowed. */
export type ShopEdition = "fan" | "player";

/** One garment size row. All measurements are centimetres. */
export interface ShopSize {
  id: string;
  /** Short display label, e.g. "M". */
  label: string;
  /** Garment chest circumference (cm) — drives the 3D fit. */
  chest: number;
  /** Garment length, shoulder seam to hem (cm). */
  length: number;
  /** Shoulder seam to seam (cm). */
  shoulder: number;
  /** Sleeve length (cm). */
  sleeve: number;
  /** Recommended wearer height range (cm). */
  minHeight: number;
  maxHeight: number;
  /** Uncheck in the admin to mark a size sold out. */
  inStock: boolean;
}

export interface ShopOrderChannels {
  lineUrl: string;
  facebookUrl: string;
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
  /** ISO-ish currency code shown next to prices, e.g. "THB", "USD", "LAK". */
  currency: string;
  /** Fan edition unit price. */
  price: number;
  /** Player edition unit price (custom name on the back). */
  playerEditionPrice: number;
  shippingNote: Bilingual;
  /** Back-of-jersey name that fan edition is locked to (team wordmark). */
  fixedJerseyName: string;
  sizes: ShopSize[];
  order: ShopOrderChannels;
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
    en: "The official 2026 competition jersey — breathable sublimated fabric in the Premium Violet Void colourway. Spin the model, pick your size, and see how it fits before you order.",
    lo: "ເສື້ອແຂ່ງຂັນທາງການປີ 2026 — ຜ້າພິມລາຍລະບາຍອາກາດດີ ໃນໂທນສີ Premium Violet Void. ໝຸນເບິ່ງໂມເດລ, ເລືອກໄຊ້ ແລະ ເບິ່ງຄວາມພໍດີກ່ອນສັ່ງຊື້.",
  },
  currency: "THB",
  price: 790,
  playerEditionPrice: 990,
  shippingNote: {
    en: "Shipping calculated after you confirm on LINE or Facebook.",
    lo: "ຄ່າຈັດສົ່ງຄິດໄລ່ຫຼັງຢືນຢັນຜ່ານ LINE ຫຼື Facebook.",
  },
  fixedJerseyName: "NIIGHTMARE",
  sizes: [
    { id: "s", label: "S", chest: 96, length: 68, shoulder: 42, sleeve: 20, minHeight: 155, maxHeight: 165, inStock: true },
    { id: "m", label: "M", chest: 102, length: 70, shoulder: 44, sleeve: 21, minHeight: 163, maxHeight: 172, inStock: true },
    { id: "l", label: "L", chest: 108, length: 72, shoulder: 46, sleeve: 22, minHeight: 170, maxHeight: 178, inStock: true },
    { id: "xl", label: "XL", chest: 114, length: 74, shoulder: 48, sleeve: 23, minHeight: 176, maxHeight: 185, inStock: true },
    { id: "xxl", label: "XXL", chest: 120, length: 76, shoulder: 50, sleeve: 24, minHeight: 183, maxHeight: 195, inStock: true },
  ],
  order: {
    lineUrl: "https://line.me/R/ti/p/@niightmare",
    facebookUrl: "https://m.me/niightmareesports",
    note: {
      en: "Send your order summary to our team — we confirm stock, total, and delivery.",
      lo: "ສົ່ງສະຫຼຸບການສັ່ງຊື້ຫາທີມງານ — ພວກເຮົາຢືນຢັນສ່ວນເຫຼືອ, ລາຄາລວມ ແລະ ການຈັດສົ່ງ.",
    },
  },
};

/** Wearer height bounds the slider is clamped to (cm). */
export const SHOP_HEIGHT_MIN = 150;
export const SHOP_HEIGHT_MAX = 200;
export const SHOP_HEIGHT_DEFAULT = 172;
export const SHOP_QTY_MAX = 20;

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
    inStock: typeof raw?.inStock === "boolean" ? raw.inStock : fallback.inStock,
  };
}

/**
 * Merge saved (partial) shop content over the defaults so a missing or partial
 * site.shop still renders cleanly. When sizes are present in the saved data we
 * use them as-is (the admin owns the chart); otherwise we fall back to defaults.
 */
export function resolveShop(raw?: Partial<ShopContent> | null): ShopContent {
  const rawSizes = Array.isArray(raw?.sizes) ? raw!.sizes : null;
  const sizes =
    rawSizes && rawSizes.length
      ? rawSizes.map((sz, i) => mergeSize(DEFAULT_SHOP.sizes[i] ?? DEFAULT_SHOP.sizes[0], sz))
      : DEFAULT_SHOP.sizes;

  return {
    enabled: typeof raw?.enabled === "boolean" ? raw.enabled : DEFAULT_SHOP.enabled,
    preorder: typeof raw?.preorder === "boolean" ? raw.preorder : DEFAULT_SHOP.preorder,
    productName: mergeBi(DEFAULT_SHOP.productName, raw?.productName),
    tagline: mergeBi(DEFAULT_SHOP.tagline, raw?.tagline),
    description: mergeBi(DEFAULT_SHOP.description, raw?.description),
    currency: (raw?.currency ?? DEFAULT_SHOP.currency) || DEFAULT_SHOP.currency,
    price: num(raw?.price, DEFAULT_SHOP.price),
    playerEditionPrice: num(raw?.playerEditionPrice, DEFAULT_SHOP.playerEditionPrice),
    shippingNote: mergeBi(DEFAULT_SHOP.shippingNote, raw?.shippingNote),
    fixedJerseyName: (raw?.fixedJerseyName ?? DEFAULT_SHOP.fixedJerseyName) || DEFAULT_SHOP.fixedJerseyName,
    sizes,
    order: {
      lineUrl: raw?.order?.lineUrl ?? DEFAULT_SHOP.order.lineUrl,
      facebookUrl: raw?.order?.facebookUrl ?? DEFAULT_SHOP.order.facebookUrl,
      note: mergeBi(DEFAULT_SHOP.order.note, raw?.order?.note),
    },
    productImage: raw?.productImage || undefined,
  };
}

/* ── Fit model ───────────────────────────────────────────────────────────────
 * Everything here is anthropometric approximation purely for fit *visualisation*
 * — it is not a medical sizing tool. Body chest circumference is estimated from
 * height + gender, then compared against the garment's chest to judge the fit. */

export interface BodyMetrics {
  /** Estimated wearer chest circumference (cm). */
  chest: number;
  /** Shoulder seam-to-seam (cm). */
  shoulder: number;
  /** Nape-to-hip torso length (cm). */
  torso: number;
  /** Hip width (cm). */
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
  /** Garment-to-body chest ease (cm); negative = smaller than the body. */
  ease: number;
  /** 0..1 how much the jersey billows past the torso — drives the 3D drape. */
  looseness: number;
  /** Tailwind-friendly token name for the accent colour of this fit. */
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

/** The size whose chest gives the most comfortable ease for this body. */
export function recommendSize(sizes: ShopSize[], heightCm: number, gender: ShopGender): ShopSize | null {
  const inStock = sizes.filter((s) => s.inStock);
  const pool = inStock.length ? inStock : sizes;
  if (!pool.length) return null;
  const body = bodyMetrics(heightCm, gender);
  const TARGET_EASE = 12; // comfortable competition fit
  return pool.reduce((best, s) =>
    Math.abs(s.chest - body.chest - TARGET_EASE) < Math.abs(best.chest - body.chest - TARGET_EASE) ? s : best
  );
}

/* ── Pricing / order helpers ─────────────────────────────────────────────── */

export function editionPrice(content: ShopContent, edition: ShopEdition): number {
  return edition === "player" ? content.playerEditionPrice : content.price;
}

export function formatPrice(amount: number, currency: string): string {
  const rounded = Math.round(amount * 100) / 100;
  const body = Number.isInteger(rounded) ? rounded.toLocaleString("en-US") : rounded.toLocaleString("en-US", { minimumFractionDigits: 2 });
  return `${body} ${currency}`;
}

export interface OrderSelection {
  gender: ShopGender;
  heightCm: number;
  sizeId: string;
  edition: ShopEdition;
  jerseyNumber: string;
  jerseyName: string;
  quantity: number;
}

/** Build the plain-text order summary that gets handed off to LINE / Facebook. */
export function buildOrderMessage(
  content: ShopContent,
  sel: OrderSelection,
  lang: Lang
): string {
  const size = content.sizes.find((s) => s.id === sel.sizeId);
  const unit = editionPrice(content, sel.edition);
  const total = unit * Math.max(1, sel.quantity);
  const pick = (b: Bilingual) => b[lang] ?? b.en;
  const editionLabel =
    sel.edition === "player"
      ? lang === "lo" ? "ນັກກິລາ (ປ່ຽນຊື່ໄດ້)" : "Player edition"
      : lang === "lo" ? "ແຟນຄັບ" : "Fan edition";
  const genderLabel =
    sel.gender === "female" ? (lang === "lo" ? "ຍິງ" : "Female") : lang === "lo" ? "ຊາຍ" : "Male";

  const L = lang === "lo"
    ? {
        head: "ສັ່ງຊື້ເສື້ອທີມ NIIGHTMARE",
        product: "ສິນຄ້າ",
        size: "ໄຊ້",
        edition: "ລຸ້ນ",
        name: "ຊື່ຫຼັງເສື້ອ",
        number: "ເບີເສື້ອ",
        qty: "ຈຳນວນ",
        ref: "ອ້າງອີງ (ສ່ວນສູງ/ເພດໂມເດລ)",
        total: "ລາຄາລວມ",
      }
    : {
        head: "NIIGHTMARE jersey order",
        product: "Product",
        size: "Size",
        edition: "Edition",
        name: "Back name",
        number: "Number",
        qty: "Quantity",
        ref: "Fit reference (height / model)",
        total: "Total",
      };

  const lines = [
    `${L.head}`,
    `${L.product}: ${pick(content.productName)}`,
    `${L.size}: ${size ? size.label : sel.sizeId.toUpperCase()}`,
    `${L.edition}: ${editionLabel}`,
    `${L.name}: ${sel.jerseyName || content.fixedJerseyName}`,
    `${L.number}: ${sel.jerseyNumber || "—"}`,
    `${L.qty}: ${sel.quantity}`,
    `${L.ref}: ${sel.heightCm}cm / ${genderLabel}`,
    `${L.total}: ${formatPrice(total, content.currency)}`,
  ];
  return lines.join("\n");
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

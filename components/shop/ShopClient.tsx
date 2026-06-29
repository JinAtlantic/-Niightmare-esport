"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useLanguage } from "@/components/context/LanguageContext";
import { useContent } from "@/components/context/ContentContext";
import { FacebookIcon } from "@/components/ui/Icons";
import { safeHref } from "@/lib/safety";
import {
  resolveShop,
  fitAssessment,
  recommendSize,
  editionPrice,
  formatPrice,
  buildOrderMessage,
  SHOP_HEIGHT_MIN,
  SHOP_HEIGHT_MAX,
  SHOP_HEIGHT_DEFAULT,
  SHOP_QTY_MAX,
  type ShopContent,
  type ShopGender,
  type ShopEdition,
  type OrderSelection,
} from "@/lib/shop";

const JerseyModelViewer = dynamic(() => import("@/components/shop/JerseyModelViewer"), {
  ssr: false,
  loading: () => <ViewerSkeleton />,
});

function ViewerSkeleton() {
  return (
    <div className="grid h-full w-full place-items-center">
      <div className="flex flex-col items-center gap-3">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-edge-bright border-t-amethyst" />
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ash">Loading 3D…</span>
      </div>
    </div>
  );
}

const COPY = {
  kicker: { en: "Official Store", lo: "ຮ້ານທາງການ" },
  dragHint: { en: "Drag to rotate · 360°", lo: "ລາກເພື່ອໝຸນ · 360°" },
  rotateOn: { en: "Auto-spin: on", lo: "ໝຸນອັດຕະໂນມັດ: ເປີດ" },
  rotateOff: { en: "Auto-spin: off", lo: "ໝຸນອັດຕະໂນມັດ: ປິດ" },
  bodyModel: { en: "Body model", lo: "ໂມເດລຮ່າງກາຍ" },
  male: { en: "Male", lo: "ຊາຍ" },
  female: { en: "Female", lo: "ຍິງ" },
  height: { en: "Model height", lo: "ສ່ວນສູງໂມເດລ" },
  size: { en: "Jersey size", lo: "ໄຊ້ເສື້ອ" },
  recommended: { en: "Recommended", lo: "ແນະນຳ" },
  soldOut: { en: "Sold out", lo: "ໝົດ" },
  edition: { en: "Edition", lo: "ລຸ້ນ" },
  fan: { en: "Fan", lo: "ແຟນຄັບ" },
  player: { en: "Player", lo: "ນັກກິລາ" },
  fanNote: { en: "Back name locked to the team wordmark.", lo: "ຊື່ຫຼັງເສື້ອລັອກເປັນຊື່ທີມ." },
  playerNote: { en: "Custom name on the back — player edition.", lo: "ໃສ່ຊື່ເອງດ້ານຫຼັງ — ລຸ້ນນັກກິລາ." },
  backName: { en: "Name on back", lo: "ຊື່ດ້ານຫຼັງ" },
  number: { en: "Jersey number", lo: "ເບີເສື້ອ" },
  quantity: { en: "Quantity", lo: "ຈຳນວນ" },
  fitTitle: { en: "Fit preview", lo: "ເບິ່ງຄວາມພໍດີ" },
  fitFor: { en: "For", lo: "ສຳລັບ" },
  weRecommend: { en: "We recommend size", lo: "ພວກເຮົາແນະນຳໄຊ້" },
  sizeChart: { en: "Size chart (cm)", lo: "ຕາຕະລາງໄຊ້ (ຊມ)" },
  chest: { en: "Chest", lo: "ຮອບເອິກ" },
  length: { en: "Length", lo: "ຄວາມຍາວ" },
  shoulder: { en: "Shoulder", lo: "ບ່າ" },
  sleeve: { en: "Sleeve", lo: "ແຂນເສື້ອ" },
  fitsHeight: { en: "Height", lo: "ສ່ວນສູງ" },
  total: { en: "Total", lo: "ລາຄາລວມ" },
  each: { en: "each", lo: "ຕໍ່ໂຕ" },
  preorder: { en: "Pre-order", lo: "ສັ່ງລ່ວງໜ້າ" },
  readyToShip: { en: "Ready to ship", lo: "ພ້ອມສົ່ງ" },
  orderLine: { en: "Order on LINE", lo: "ສັ່ງຜ່ານ LINE" },
  orderFb: { en: "Order on Facebook", lo: "ສັ່ງຜ່ານ Facebook" },
  copySummary: { en: "Copy order summary", lo: "ສຳເນົາສະຫຼຸບການສັ່ງ" },
  copied: { en: "Order summary copied — paste it in the chat.", lo: "ສຳເນົາແລ້ວ — ວາງໃນແຊັດໄດ້ເລີຍ." },
  comingSoon: { en: "Store opening soon", lo: "ຮ້ານກຳລັງຈະເປີດ" },
  comingSoonBody: {
    en: "The NIIGHTMARE jersey store is being prepared. Check back shortly.",
    lo: "ຮ້ານເສື້ອທີມ NIIGHTMARE ກຳລັງຈັດກຽມ. ກັບມາເບິ່ງໃໝ່ໄວໆນີ້.",
  },
  pickSize: { en: "Select an available size to order.", lo: "ເລືອກໄຊ້ທີ່ມີເພື່ອສັ່ງຊື້." },
};

const FIT_TIP = {
  tight: { en: "Snug — size up for comfort.", lo: "ຄັບ — ຂຶ້ນໄຊ້ເພື່ອຄວາມສະບາຍ." },
  fitted: { en: "Athletic, close to the body.", lo: "ຟິດເຂົ້າຮູບ ໃກ້ກັບຕົວ." },
  regular: { en: "Balanced competition fit.", lo: "ພໍດີແບບການແຂ່ງຂັນ." },
  relaxed: { en: "Easy, roomy comfort.", lo: "ຫຼວມສະບາຍ." },
  oversized: { en: "Very loose, streetwear drape.", lo: "ຫຼວມຫຼາຍ ແບບສະຕຣີດແວร์." },
} as const;

export default function ShopClient() {
  const { pick, lang } = useLanguage();
  const { site } = useContent();
  const shop: ShopContent = resolveShop((site as { shop?: Partial<ShopContent> }).shop);

  const [gender, setGender] = useState<ShopGender>("male");
  const [heightCm, setHeightCm] = useState(SHOP_HEIGHT_DEFAULT);
  const [edition, setEdition] = useState<ShopEdition>("fan");
  const [number, setNumber] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [autoRotate, setAutoRotate] = useState(true);
  const [toast, setToast] = useState(false);

  const recommended = useMemo(
    () => recommendSize(shop.sizes, heightCm, gender),
    [shop.sizes, heightCm, gender]
  );
  const [sizeId, setSizeId] = useState<string>(() => {
    const r = recommendSize(shop.sizes, SHOP_HEIGHT_DEFAULT, "male");
    return r?.id ?? shop.sizes[0]?.id ?? "m";
  });

  const selectedSize =
    shop.sizes.find((s) => s.id === sizeId) ?? recommended ?? shop.sizes[0];
  const fit = selectedSize ? fitAssessment(selectedSize, heightCm, gender) : null;

  const jerseyName = edition === "player" ? playerName || shop.fixedJerseyName : shop.fixedJerseyName;
  const unit = editionPrice(shop, edition);
  const total = unit * quantity;
  const canOrder = shop.enabled && !!selectedSize && selectedSize.inStock;

  const toneClass: Record<string, string> = {
    glow: "text-glow border-glow/40 bg-glow/10",
    win: "text-win border-win/40 bg-win/10",
    loss: "text-loss border-loss/40 bg-loss/10",
  };

  function buildSelection(): OrderSelection {
    return {
      gender,
      heightCm,
      sizeId: selectedSize?.id ?? sizeId,
      edition,
      jerseyNumber: number,
      jerseyName,
      quantity,
    };
  }

  async function copySummary() {
    const msg = buildOrderMessage(shop, buildSelection(), lang);
    try {
      await navigator.clipboard.writeText(msg);
    } catch {
      /* clipboard blocked — the order still opens the channel */
    }
    setToast(true);
    window.setTimeout(() => setToast(false), 2600);
  }

  async function order(channel: "line" | "facebook") {
    await copySummary();
    const url = channel === "line" ? safeHref(shop.order.lineUrl) : safeHref(shop.order.facebookUrl);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  if (!shop.enabled) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-4 pt-24">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-soul">
            {pick(COPY.comingSoon)}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-ash">{pick(COPY.comingSoonBody)}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative mx-auto max-w-7xl px-4 pb-24 pt-24 md:px-6 md:pt-28">
      {/* compact header — straight into the product, not a marketing band */}
      <header className="mb-6 md:mb-8">
        <p className="inline-flex items-center gap-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.34em] text-spectre/70">
          <span className="h-[5px] w-[5px] rounded-full bg-amethyst shadow-[0_0_10px_#c77dff]" />
          {pick(COPY.kicker)}
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold uppercase leading-[1.05] tracking-tight text-soul [text-shadow:0_2px_30px_rgba(168,85,247,0.3)] md:text-4xl">
          {pick(shop.productName)}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-spectre/85 md:text-base">
          {pick(shop.tagline)}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        {/* ── 3D viewer ─────────────────────────────────────────────── */}
        <section className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative overflow-hidden rounded-md border border-edge bg-gradient-to-b from-crypt2 via-crypt to-void">
            <div className="scythe-line absolute inset-x-0 top-0 h-[2px] opacity-70" aria-hidden />
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-amethyst/15 blur-3xl"
            />
            <div className="relative h-[clamp(360px,52vh,560px)] w-full">
              {selectedSize && (
                <JerseyModelViewer
                  gender={gender}
                  heightCm={heightCm}
                  size={selectedSize}
                  jerseyName={jerseyName}
                  jerseyNumber={number}
                  autoRotate={autoRotate}
                  className="h-full w-full"
                />
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-edge bg-void/60 px-4 py-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ash">
                {pick(COPY.dragHint)}
              </span>
              <button
                type="button"
                onClick={() => setAutoRotate((v) => !v)}
                className="rounded-md border border-edge px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-spectre transition-colors hover:border-amethyst hover:text-soul"
              >
                {autoRotate ? pick(COPY.rotateOn) : pick(COPY.rotateOff)}
              </button>
            </div>
          </div>

          {/* fit preview */}
          {fit && selectedSize && (
            <div className="mt-4 rounded-md border border-edge bg-crypt/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ash">
                  {pick(COPY.fitTitle)}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 font-display text-xs font-bold uppercase tracking-[0.12em] ${toneClass[fit.tone]}`}
                >
                  {pick(fit.label)}
                </span>
              </div>
              <p className="mt-2 text-sm text-spectre/90">{pick(FIT_TIP[fit.level])}</p>
              <p className="mt-1 font-mono text-[11px] text-ash">
                {pick(COPY.fitFor)} {heightCm}cm · {pick(gender === "male" ? COPY.male : COPY.female)} ·{" "}
                {pick(COPY.size)} {selectedSize.label}
              </p>
              {recommended && (
                <p className="mt-2 font-mono text-[11px] text-spectre">
                  {pick(COPY.weRecommend)}{" "}
                  <button
                    type="button"
                    onClick={() => setSizeId(recommended.id)}
                    className="font-bold text-glow underline-offset-2 hover:underline"
                  >
                    {recommended.label}
                  </button>
                </p>
              )}
            </div>
          )}
        </section>

        {/* ── configurator + order ──────────────────────────────────── */}
        <section className="space-y-6">
          {/* gender */}
          <Field label={pick(COPY.bodyModel)}>
            <div className="grid grid-cols-2 gap-2">
              {(["male", "female"] as ShopGender[]).map((g) => (
                <ToggleButton key={g} active={gender === g} onClick={() => setGender(g)}>
                  {pick(g === "male" ? COPY.male : COPY.female)}
                </ToggleButton>
              ))}
            </div>
          </Field>

          {/* height */}
          <Field
            label={pick(COPY.height)}
            aside={<span className="font-mono text-sm font-bold text-soul">{heightCm} cm</span>}
          >
            <input
              type="range"
              min={SHOP_HEIGHT_MIN}
              max={SHOP_HEIGHT_MAX}
              value={heightCm}
              onChange={(e) => setHeightCm(Number(e.target.value))}
              className="shop-range w-full"
              aria-label={pick(COPY.height)}
            />
          </Field>

          {/* size */}
          <Field label={pick(COPY.size)}>
            <div className="flex flex-wrap gap-2">
              {shop.sizes.map((s) => {
                const active = selectedSize?.id === s.id;
                const isRec = recommended?.id === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={!s.inStock}
                    onClick={() => setSizeId(s.id)}
                    className={`relative min-w-[58px] rounded-md border px-3 py-2.5 font-display text-sm font-bold uppercase tracking-wide transition-all ${
                      active
                        ? "border-amethyst bg-amethyst/15 text-soul shadow-[0_0_16px_rgba(168,85,247,0.25)]"
                        : s.inStock
                          ? "border-edge bg-void/50 text-spectre hover:border-edge-bright hover:text-soul"
                          : "cursor-not-allowed border-edge/60 bg-void/30 text-ash-dim line-through"
                    }`}
                  >
                    {s.label}
                    {isRec && s.inStock && (
                      <span className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-glow shadow-[0_0_8px_#c77dff]" />
                    )}
                  </button>
                );
              })}
            </div>
            {selectedSize && !selectedSize.inStock && (
              <p className="mt-2 font-mono text-[11px] text-loss">{pick(COPY.soldOut)}</p>
            )}
          </Field>

          {/* edition */}
          <Field label={pick(COPY.edition)}>
            <div className="grid grid-cols-2 gap-2">
              {(["fan", "player"] as ShopEdition[]).map((e) => (
                <ToggleButton key={e} active={edition === e} onClick={() => setEdition(e)}>
                  <span className="flex flex-col items-center">
                    <span>{pick(e === "fan" ? COPY.fan : COPY.player)}</span>
                    <span className="font-mono text-[10px] font-normal tracking-normal text-ash">
                      {formatPrice(editionPrice(shop, e), shop.currency)}
                    </span>
                  </span>
                </ToggleButton>
              ))}
            </div>
            <p className="mt-2 font-mono text-[11px] text-ash">
              {pick(edition === "fan" ? COPY.fanNote : COPY.playerNote)}
            </p>
          </Field>

          {/* name + number */}
          <div className="grid grid-cols-2 gap-3">
            <Field label={pick(COPY.backName)}>
              <input
                type="text"
                value={edition === "player" ? playerName : shop.fixedJerseyName}
                onChange={(e) => setPlayerName(e.target.value.slice(0, 12))}
                disabled={edition !== "player"}
                placeholder={shop.fixedJerseyName}
                className="w-full rounded-md border border-edge bg-void/60 px-3 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-soul outline-none transition-colors placeholder:text-ash-dim focus:border-amethyst disabled:cursor-not-allowed disabled:text-ash"
              />
            </Field>
            <Field label={pick(COPY.number)}>
              <input
                type="text"
                inputMode="numeric"
                value={number}
                onChange={(e) => setNumber(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
                placeholder="00"
                className="w-full rounded-md border border-edge bg-void/60 px-3 py-2.5 text-center font-display text-lg font-bold tracking-wide text-soul outline-none transition-colors placeholder:text-ash-dim focus:border-amethyst"
              />
            </Field>
          </div>

          {/* quantity */}
          <Field label={pick(COPY.quantity)}>
            <div className="inline-flex items-center rounded-md border border-edge bg-void/50">
              <Stepper label="−" onClick={() => setQuantity((q) => Math.max(1, q - 1))} />
              <span className="w-12 text-center font-display text-lg font-bold text-soul">{quantity}</span>
              <Stepper label="+" onClick={() => setQuantity((q) => Math.min(SHOP_QTY_MAX, q + 1))} />
            </div>
          </Field>

          {/* size chart */}
          <details className="group rounded-md border border-edge bg-crypt/40">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-soul">
              {pick(COPY.sizeChart)}
              <span className="font-mono text-lg leading-none text-amethyst transition-transform group-open:rotate-180">
                ⌄
              </span>
            </summary>
            <div className="overflow-x-auto border-t border-edge px-4 py-3">
              <table className="w-full min-w-[420px] border-collapse text-left font-mono text-[11px]">
                <thead>
                  <tr className="text-ash">
                    <th className="py-1.5 pr-3 font-semibold uppercase tracking-[0.12em]">{pick(COPY.size)}</th>
                    <th className="py-1.5 pr-3 font-semibold uppercase tracking-[0.12em]">{pick(COPY.chest)}</th>
                    <th className="py-1.5 pr-3 font-semibold uppercase tracking-[0.12em]">{pick(COPY.length)}</th>
                    <th className="py-1.5 pr-3 font-semibold uppercase tracking-[0.12em]">{pick(COPY.shoulder)}</th>
                    <th className="py-1.5 pr-3 font-semibold uppercase tracking-[0.12em]">{pick(COPY.sleeve)}</th>
                    <th className="py-1.5 font-semibold uppercase tracking-[0.12em]">{pick(COPY.fitsHeight)}</th>
                  </tr>
                </thead>
                <tbody className="text-spectre">
                  {shop.sizes.map((s) => (
                    <tr
                      key={s.id}
                      className={`border-t border-edge/60 ${selectedSize?.id === s.id ? "text-soul" : ""}`}
                    >
                      <td className="py-1.5 pr-3 font-display font-bold">{s.label}</td>
                      <td className="py-1.5 pr-3">{s.chest}</td>
                      <td className="py-1.5 pr-3">{s.length}</td>
                      <td className="py-1.5 pr-3">{s.shoulder}</td>
                      <td className="py-1.5 pr-3">{s.sleeve}</td>
                      <td className="py-1.5">
                        {s.minHeight}–{s.maxHeight}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          {/* price + order */}
          <div className="rounded-md border border-edge bg-crypt/60 p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-edge bg-void/50 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-spectre">
                  {pick(shop.preorder ? COPY.preorder : COPY.readyToShip)}
                </span>
                <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ash">
                  {pick(COPY.total)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-3xl font-bold text-soul">
                  {formatPrice(total, shop.currency)}
                </p>
                <p className="font-mono text-[11px] text-ash">
                  {formatPrice(unit, shop.currency)} {pick(COPY.each)} × {quantity}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-2.5">
              <button
                type="button"
                disabled={!canOrder}
                onClick={() => order("line")}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md border border-amethyst bg-amethyst/15 px-5 py-3 font-display text-sm font-bold uppercase tracking-[0.16em] text-soul transition-all hover:bg-amethyst/25 hover:shadow-[0_0_22px_rgba(168,85,247,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LineGlyph /> {pick(COPY.orderLine)}
              </button>
              <button
                type="button"
                disabled={!canOrder}
                onClick={() => order("facebook")}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md border border-edge bg-void/50 px-5 py-3 font-display text-sm font-bold uppercase tracking-[0.16em] text-spectre transition-all hover:border-amethyst hover:text-soul disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FacebookIcon size={16} /> {pick(COPY.orderFb)}
              </button>
              <button
                type="button"
                disabled={!canOrder}
                onClick={copySummary}
                className="font-mono text-[11px] uppercase tracking-[0.16em] text-ash transition-colors hover:text-spectre disabled:opacity-50"
              >
                {pick(COPY.copySummary)}
              </button>
            </div>

            {!canOrder && shop.enabled && (
              <p className="mt-3 text-center font-mono text-[11px] text-loss">{pick(COPY.pickSize)}</p>
            )}
            <p className="mt-4 text-center text-[11px] leading-relaxed text-ash">{pick(shop.shippingNote)}</p>
            <p className="mt-1 text-center text-[11px] leading-relaxed text-ash-dim">{pick(shop.order.note)}</p>
          </div>
        </section>
      </div>

      {/* toast */}
      <div
        aria-live="polite"
        className={`pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 transition-all duration-300 ${
          toast ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <span className="rounded-md border border-amethyst/50 bg-crypt px-4 py-2.5 font-mono text-[11px] text-soul shadow-[0_0_24px_rgba(168,85,247,0.3)]">
          {pick(COPY.copied)}
        </span>
      </div>
    </main>
  );
}

/* ── small presentational helpers ─────────────────────────────────────────── */

function Field({
  label,
  aside,
  children,
}: {
  label: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ash">
          {label}
        </span>
        {aside}
      </div>
      {children}
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[48px] rounded-md border px-4 py-2.5 font-display text-sm font-bold uppercase tracking-[0.1em] transition-all ${
        active
          ? "border-amethyst bg-amethyst/15 text-soul shadow-[0_0_16px_rgba(168,85,247,0.22)]"
          : "border-edge bg-void/50 text-spectre hover:border-edge-bright hover:text-soul"
      }`}
    >
      {children}
    </button>
  );
}

function Stepper({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label === "+" ? "increase" : "decrease"}
      className="grid h-11 w-11 place-items-center font-display text-xl font-bold text-spectre transition-colors hover:text-amethyst"
    >
      {label}
    </button>
  );
}

function LineGlyph() {
  return (
    <span className="grid h-4 w-4 place-items-center rounded-[3px] bg-[#06C755] font-mono text-[8px] font-bold leading-none text-white">
      L
    </span>
  );
}

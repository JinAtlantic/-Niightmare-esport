"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import JerseyShowcase from "@/components/shop/JerseyShowcase";
import ShopTopActions from "@/components/shop/ShopTopActions";
import { useShopCart } from "@/components/shop/useShopCart";
import { useContent } from "@/components/context/ContentContext";
import { useLanguage } from "@/components/context/LanguageContext";
import { formatPrice, resolveShop, resolveShopCollection, sizePrice, SHOP_QTY_MAX, type ShopContent } from "@/lib/shop";
import { shopCartQuantity } from "@/lib/shopCart";

const COPY = {
  back: { en: "All products", lo: "ສິນຄ້າທັງໝົດ" },
  selectSize: { en: "Select size", lo: "ເລືອກໄຊ້" },
  quantity: { en: "Quantity", lo: "ຈຳນວນ" },
  add: { en: "Add to cart", lo: "ເພີ່ມໃສ່ກະຕ່າ" },
  added: { en: "Added to cart", lo: "ເພີ່ມໃສ່ກະຕ່າແລ້ວ" },
  buyNow: { en: "Buy now", lo: "ຊື້ຕອນນີ້" },
  inStock: { en: "Ready to ship", lo: "ພ້ອມສົ່ງ" },
  preorder: { en: "Pre-order", lo: "ສັ່ງຈອງ" },
  soldOut: { en: "Sold out", lo: "ໝົດ" },
  unavailable: { en: "This product is not available.", lo: "ສິນຄ້ານີ້ຍັງບໍ່ພ້ອມຂາຍ" },
  reserved: { en: "Official edition", lo: "ຮຸ່ນທາງການ" },
  sizeGuide: { en: "Size details", lo: "ລາຍລະອຽດໄຊ້" },
  chest: { en: "Chest", lo: "ຮອບເອິກ" },
  length: { en: "Length", lo: "ຄວາມຍາວ" },
};

export default function ShopProductClient({ slug }: { slug: string }) {
  const router = useRouter();
  const { site } = useContent();
  const { pick } = useLanguage();
  const shop = useMemo(() => resolveShop((site as { shop?: Partial<ShopContent> }).shop), [site]);
  const product = resolveShopCollection(shop, slug);
  const exactProduct = shop.collections.find((entry) => entry.enabled && (entry.slug === slug || entry.id === slug));
  const activeProduct = exactProduct ?? (shop.collections.filter((entry) => entry.enabled).length === 1 ? product : undefined);
  const { items, add } = useShopCart(shop);
  const defaultSize = activeProduct?.sizes.find((size) => size.availability !== "sold_out")?.id ?? "";
  const [sizeId, setSizeId] = useState(defaultSize);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!shop.enabled || !activeProduct) {
    return (
      <section className="grid min-h-[70vh] place-items-center px-4 pt-24 text-center">
        <div>
          <h1 className="font-display text-2xl font-black uppercase text-soul">{pick(COPY.unavailable)}</h1>
          <Link href="/shop" className="mt-5 inline-flex min-h-[44px] items-center rounded-md border border-amethyst bg-amethyst/15 px-5 font-display text-sm font-bold uppercase tracking-wide text-soul">← {pick(COPY.back)}</Link>
        </div>
      </section>
    );
  }

  const selectedSize = activeProduct.sizes.find((size) => size.id === sizeId && size.availability !== "sold_out");
  const canBuy = Boolean(selectedSize);
  const unitPrice = sizePrice(activeProduct, selectedSize);

  function addSelected(goToCart = false) {
    if (!selectedSize) return;
    add({ collectionId: activeProduct!.id, sizeId: selectedSize.id, quantity });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
    if (goToCart) router.push("/shop?view=cart");
  }

  return (
    <>
      <PageHeader title={pick(activeProduct.productName)} titleClassName="text-2xl sm:text-3xl md:text-4xl" subtitle={pick(activeProduct.tagline)} />
      <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-8 md:px-6 md:pt-12">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(60%_65%_at_18%_0%,rgba(168,85,247,0.2),transparent_74%),radial-gradient(48%_55%_at_90%_12%,rgba(199,125,255,0.12),transparent_70%)]" />
        <div className="mb-7 flex flex-col justify-between gap-4 border-b border-edge pb-5 sm:flex-row sm:items-center">
          <Link href="/shop" className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ash transition-colors hover:text-glow">← {pick(COPY.back)}</Link>
          <ShopTopActions cartCount={shopCartQuantity(items)} />
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:items-start">
          <JerseyShowcase image={activeProduct.productImage} productName={activeProduct.productName} jerseyNumber={activeProduct.fixedJerseyNumber} />

          <section className="lg:sticky lg:top-24">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-glow">NIIGHTMARE SUPPLY</p>
            <h2 className="mt-2 font-display text-2xl font-black uppercase leading-tight tracking-wide text-soul md:text-3xl">{pick(activeProduct.productName)}</h2>
            <p className="mt-3 text-sm leading-relaxed text-spectre/85">{pick(activeProduct.description)}</p>
            <p className="mt-5 font-display text-3xl font-black tabular-nums text-glow">{formatPrice(unitPrice, activeProduct.currency)}</p>

            <div className="mt-7">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-soul">{pick(COPY.selectSize)}</h2>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ash">cm</span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {activeProduct.sizes.map((size) => {
                  const selected = size.id === sizeId;
                  const disabled = size.availability === "sold_out";
                  const availabilityClass = size.availability === "in_stock"
                    ? "border-win/40 bg-win/10 text-win"
                    : size.availability === "preorder"
                      ? "border-glow/40 bg-glow/10 text-glow"
                      : "border-loss/40 bg-loss/10 text-loss";
                  return (
                    <button key={size.id} type="button" disabled={disabled} aria-pressed={selected} onClick={() => setSizeId(size.id)} className={`relative min-h-[82px] rounded-md border px-2 py-3 font-display font-black uppercase transition-all ${selected ? "border-glow bg-amethyst/20 text-soul shadow-glow-soft" : disabled ? "cursor-not-allowed border-edge bg-void/35 text-ash-dim" : "border-edge-bright bg-crypt/70 text-spectre hover:border-amethyst hover:text-soul"}`}>
                      <span data-size-label className={`block text-lg leading-none sm:text-xl ${disabled ? "line-through" : ""}`}>{size.label}</span>
                      <span data-size-availability className={`mt-2 flex min-h-6 w-full items-center justify-center rounded-md border px-1.5 py-1 font-mono text-[10px] font-bold uppercase leading-tight tracking-[0.04em] no-underline sm:text-[11px] ${availabilityClass}`}>
                        {pick(size.availability === "in_stock" ? COPY.inStock : size.availability === "preorder" ? COPY.preorder : COPY.soldOut)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedSize && (
              <details className="mt-4 rounded-md border border-edge bg-crypt/45 px-4 py-3">
                <summary className="cursor-pointer font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-spectre">{pick(COPY.sizeGuide)}</summary>
                <div className="mt-3 grid grid-cols-2 gap-3 font-mono text-xs text-ash">
                  <span>{pick(COPY.chest)} <b className="text-soul">{selectedSize.chest} cm</b></span>
                  <span>{pick(COPY.length)} <b className="text-soul">{selectedSize.length} cm</b></span>
                </div>
              </details>
            )}

            <div className="mt-6 flex items-end gap-3">
              <label className="block w-28">
                <span className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-ash">{pick(COPY.quantity)}</span>
                <input type="number" inputMode="numeric" min={1} max={SHOP_QTY_MAX} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(SHOP_QTY_MAX, Number(event.target.value) || 1)))} className="min-h-[50px] w-full rounded-md border border-edge-bright bg-void/65 px-3 text-center font-display text-lg font-black text-soul outline-none focus:border-amethyst" />
              </label>
              <button type="button" disabled={!canBuy} onClick={() => addSelected(false)} className="min-h-[50px] flex-1 rounded-md border border-amethyst bg-gradient-to-r from-amethyst/30 to-glow/20 px-4 font-display text-sm font-black uppercase tracking-[0.12em] text-soul shadow-glow-soft transition-all hover:from-amethyst/45 hover:to-glow/30 disabled:cursor-not-allowed disabled:opacity-45">
                {added ? `✓ ${pick(COPY.added)}` : pick(COPY.add)}
              </button>
            </div>
            <button type="button" disabled={!canBuy} onClick={() => addSelected(true)} className="mt-3 min-h-[50px] w-full rounded-md border border-glow/60 bg-glow/10 px-4 font-display text-sm font-black uppercase tracking-[0.14em] text-glow transition-colors hover:bg-glow/20 disabled:cursor-not-allowed disabled:opacity-45">
              {pick(COPY.buyNow)}
            </button>

            {activeProduct.rightsNote.en || activeProduct.rightsNote.lo ? (
              <div className="mt-5 border-l-2 border-amethyst bg-amethyst/10 px-4 py-3">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-glow">{pick(COPY.reserved)}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-spectre/85">{pick(activeProduct.rightsNote)}</p>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import { useContent } from "@/components/context/ContentContext";
import { useLanguage } from "@/components/context/LanguageContext";
import ShopTopActions from "@/components/shop/ShopTopActions";
import { useShopCart } from "@/components/shop/useShopCart";
import { formatPrice, resolveShop, sizePrice, type ShopCollection, type ShopContent } from "@/lib/shop";
import { safeImageSrc } from "@/lib/safety";
import { shopCartQuantity } from "@/lib/shopCart";

type SortId = "featured" | "price-low" | "price-high" | "name";

const COPY = {
  title: { en: "Shop", lo: "ຮ້ານຄ້າ" },
  subtitle: { en: "Official NIIGHTMARE gear — built for the team and the faithful.", lo: "ສິນຄ້າທາງການຈາກ NIIGHTMARE ສຳລັບທີມ ແລະ ແຟນໆ" },
  allProducts: { en: "All products", lo: "ສິນຄ້າທັງໝົດ" },
  productCount: { en: "products", lo: "ລາຍການ" },
  sort: { en: "Sort", lo: "ຈັດລຽງ" },
  featured: { en: "Featured", lo: "ແນະນຳ" },
  priceLow: { en: "Price: low to high", lo: "ລາຄາ: ຕ່ຳໄປສູງ" },
  priceHigh: { en: "Price: high to low", lo: "ລາຄາ: ສູງໄປຕ່ຳ" },
  name: { en: "Name", lo: "ຊື່ສິນຄ້າ" },
  from: { en: "From", lo: "ເລີ່ມຕົ້ນ" },
  view: { en: "View product", lo: "ເບິ່ງສິນຄ້າ" },
  inStock: { en: "Ready to ship", lo: "ພ້ອມສົ່ງ" },
  preorder: { en: "Pre-order", lo: "ສັ່ງຈອງ" },
  soldOut: { en: "Sold out", lo: "ໝົດ" },
  empty: { en: "No products are available yet.", lo: "ຍັງບໍ່ມີສິນຄ້າທີ່ເປີດຂາຍ" },
};

function collectionState(collection: ShopCollection) {
  if (collection.sizes.some((size) => size.availability === "in_stock")) return "in_stock" as const;
  if (collection.sizes.some((size) => size.availability === "preorder")) return "preorder" as const;
  return "sold_out" as const;
}

function minimumPrice(collection: ShopCollection) {
  const available = collection.sizes.filter((size) => size.availability !== "sold_out");
  const pool = available.length ? available : collection.sizes;
  return pool.length ? Math.min(...pool.map((size) => sizePrice(collection, size))) : collection.price;
}

export default function ShopCatalogClient() {
  const { site } = useContent();
  const { pick } = useLanguage();
  const shop = useMemo(
    () => resolveShop((site as { shop?: Partial<ShopContent> }).shop),
    [site]
  );
  const { items } = useShopCart(shop);
  const [sort, setSort] = useState<SortId>("featured");
  const products = useMemo(() => {
    const enabled = shop.collections.filter((collection) => collection.enabled);
    if (sort === "price-low") return [...enabled].sort((a, b) => minimumPrice(a) - minimumPrice(b));
    if (sort === "price-high") return [...enabled].sort((a, b) => minimumPrice(b) - minimumPrice(a));
    if (sort === "name") return [...enabled].sort((a, b) => pick(a.productName).localeCompare(pick(b.productName)));
    return enabled;
  }, [pick, shop.collections, sort]);

  if (!shop.enabled) {
    return <EmptyStore />;
  }

  return (
    <>
      <PageHeader title={pick(COPY.title)} subtitle={pick(COPY.subtitle)} />
      <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-10 md:px-6 md:pt-14">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(55%_70%_at_25%_0%,rgba(168,85,247,0.18),transparent_75%),radial-gradient(45%_60%_at_90%_8%,rgba(199,125,255,0.1),transparent_72%)]" />

        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-edge pb-6 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-glow">NIIGHTMARE SUPPLY</p>
            <h1 className="mt-2 font-display text-2xl font-black uppercase tracking-wide text-soul md:text-3xl">{pick(COPY.allProducts)}</h1>
            <p className="mt-1 font-mono text-xs text-ash">{products.length} {pick(COPY.productCount)}</p>
          </div>
          <ShopTopActions current="shop" cartCount={shopCartQuantity(items)} />
        </div>

        <div className="mb-7 flex justify-end">
          <label className="flex w-full items-center gap-3 sm:w-auto">
            <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ash">{pick(COPY.sort)}</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortId)} className="min-h-[44px] w-full rounded-md border border-edge-bright bg-crypt/80 px-3 font-display text-xs font-bold uppercase tracking-[0.08em] text-soul outline-none focus:border-amethyst sm:w-56">
              <option value="featured">{pick(COPY.featured)}</option>
              <option value="price-low">{pick(COPY.priceLow)}</option>
              <option value="price-high">{pick(COPY.priceHigh)}</option>
              <option value="name">{pick(COPY.name)}</option>
            </select>
          </label>
        </div>

        {products.length ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center rounded-md border border-dashed border-edge-bright bg-crypt/35 p-8 text-center text-sm text-ash">
            {pick(COPY.empty)}
          </div>
        )}
      </div>
    </>
  );
}

function ProductCard({ product }: { product: ShopCollection }) {
  const { pick } = useLanguage();
  const state = collectionState(product);
  const image = safeImageSrc(product.productImage);
  const stateCopy = state === "in_stock" ? COPY.inStock : state === "preorder" ? COPY.preorder : COPY.soldOut;
  const stateClass = state === "in_stock" ? "border-win/45 bg-win/10 text-win" : state === "preorder" ? "border-glow/45 bg-glow/10 text-glow" : "border-loss/45 bg-loss/10 text-loss";

  return (
    <article className="group overflow-hidden rounded-md border border-edge bg-crypt/55 transition-all duration-300 hover:-translate-y-1 hover:border-amethyst/70 hover:shadow-glow-soft">
      <Link data-testid="product-card-link" href={`/shop/${encodeURIComponent(product.slug)}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-glow">
        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_50%_35%,rgba(168,85,247,0.2),rgba(11,7,16,0.92)_72%)]" style={{ paddingBottom: "118%" }}>
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={pick(product.productName)} className="absolute inset-0 h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04] sm:p-6" />
          ) : (
            <div className="absolute inset-0 grid place-items-center p-4 text-center">
              <span className="font-display text-4xl font-black text-amethyst/35">#{product.fixedJerseyNumber || "7"}</span>
            </div>
          )}
          <span className={`absolute left-2 top-2 rounded-md border px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase leading-none tracking-[0.08em] sm:left-3 sm:top-3 sm:text-[11px] ${stateClass}`}>
            {pick(stateCopy)}
          </span>
        </div>
        <div className="p-3 sm:p-4">
          <h2 className="line-clamp-2 min-h-10 font-display text-sm font-black uppercase leading-tight tracking-wide text-soul sm:text-base">{pick(product.productName)}</h2>
          <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ash">{pick(COPY.from)}</p>
          <p className="mt-0.5 whitespace-nowrap font-display text-base font-black tabular-nums text-glow sm:text-lg">{formatPrice(minimumPrice(product), product.currency)}</p>
          <span className="mt-3 inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-spectre transition-colors group-hover:text-glow">
            {pick(COPY.view)} <span aria-hidden>→</span>
          </span>
        </div>
      </Link>
    </article>
  );
}

function EmptyStore() {
  const { pick } = useLanguage();
  return (
    <section className="grid min-h-[70vh] place-items-center px-4 pt-24">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-soul">{pick({ en: "Store opening soon", lo: "ຮ້ານກຳລັງຈະເປີດ" })}</h1>
        <p className="mt-4 text-sm leading-relaxed text-ash">{pick(COPY.empty)}</p>
      </div>
    </section>
  );
}

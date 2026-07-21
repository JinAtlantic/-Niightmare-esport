"use client";

import Link from "next/link";
import { useLanguage } from "@/components/context/LanguageContext";

export default function ShopTopActions({ cartCount, current }: { cartCount: number; current?: "shop" | "cart" | "orders" }) {
  const { pick } = useLanguage();
  const itemClass = (active: boolean) =>
    `inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md border px-4 font-display text-xs font-bold uppercase tracking-[0.14em] transition-colors ${
      active
        ? "border-amethyst bg-amethyst/15 text-soul shadow-glow-soft"
        : "border-edge-bright bg-crypt/75 text-spectre hover:border-amethyst hover:text-soul"
    }`;

  return (
    <nav aria-label={pick({ en: "Shop navigation", lo: "ເມນູຮ້ານຄ້າ" })} className="flex flex-wrap items-center gap-2">
      <Link href="/shop" className={itemClass(current === "shop")}>
        {pick({ en: "All products", lo: "ສິນຄ້າທັງໝົດ" })}
      </Link>
      <Link href="/shop?view=orders" className={itemClass(current === "orders")}>
        {pick({ en: "My orders", lo: "ອໍເດີຂອງຂ້ອຍ" })}
      </Link>
      <Link href="/shop?view=cart" className={itemClass(current === "cart")} aria-label={`${pick({ en: "Cart", lo: "ກະຕ່າ" })}: ${cartCount}`}>
        <CartGlyph />
        {pick({ en: "Cart", lo: "ກະຕ່າ" })}
        <span className="keep-latin min-w-5 rounded-full border border-glow/50 bg-glow/15 px-1.5 py-0.5 text-center font-mono text-[10px] text-glow">
          {cartCount}
        </span>
      </Link>
    </nav>
  );
}

function CartGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20.5 8H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="20" r="1.3" fill="currentColor" />
      <circle cx="17" cy="20" r="1.3" fill="currentColor" />
    </svg>
  );
}

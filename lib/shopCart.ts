import type { ShopContent, ShopOrderItem } from "@/lib/shop";

export const SHOP_CART_STORAGE_KEY = "nm-shop-cart-v1";
export const SHOP_CART_EVENT = "nm-shop-cart-change";

export function shopCartItemKey(collectionId: string, sizeId: string): string {
  return `${collectionId}:${sizeId}`;
}

export function parseShopCartItemKey(key: string): { collectionId: string; sizeId: string } | null {
  const split = key.indexOf(":");
  if (split <= 0 || split === key.length - 1) return null;
  return { collectionId: key.slice(0, split), sizeId: key.slice(split + 1) };
}

export function normaliseShopCart(content: ShopContent, raw: unknown): ShopOrderItem[] {
  if (!Array.isArray(raw)) return [];
  const merged = new Map<string, ShopOrderItem>();

  for (const candidate of raw) {
    if (!candidate || typeof candidate !== "object") continue;
    const item = candidate as Partial<ShopOrderItem>;
    const collectionId = String(item.collectionId || "").trim();
    const sizeId = String(item.sizeId || "").trim();
    const collection = content.collections.find(
      (entry) => entry.enabled && (entry.id === collectionId || entry.slug === collectionId)
    );
    const size = collection?.sizes.find((entry) => entry.id === sizeId && entry.availability !== "sold_out");
    const quantity = Math.max(0, Math.min(999, Math.floor(Number(item.quantity) || 0)));
    if (!collection || !size || quantity < 1) continue;

    const key = shopCartItemKey(collection.id, size.id);
    const previous = merged.get(key)?.quantity ?? 0;
    merged.set(key, {
      collectionId: collection.id,
      sizeId: size.id,
      quantity: Math.min(999, previous + quantity),
    });
  }

  return Array.from(merged.values());
}

export function readShopCart(content: ShopContent): ShopOrderItem[] {
  if (typeof window === "undefined") return [];
  try {
    return normaliseShopCart(content, JSON.parse(window.localStorage.getItem(SHOP_CART_STORAGE_KEY) || "[]"));
  } catch {
    return [];
  }
}

export function writeShopCart(content: ShopContent, items: ShopOrderItem[]): ShopOrderItem[] {
  const next = normaliseShopCart(content, items);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(SHOP_CART_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(SHOP_CART_EVENT, { detail: next }));
    } catch {
      /* localStorage unavailable — keep the in-memory UI state */
    }
  }
  return next;
}

export function shopCartQuantity(items: ShopOrderItem[]): number {
  return items.reduce((total, item) => total + Math.max(0, Number(item.quantity) || 0), 0);
}

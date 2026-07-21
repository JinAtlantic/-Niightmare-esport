"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ShopContent, ShopOrderItem } from "@/lib/shop";
import {
  readShopCart,
  SHOP_CART_EVENT,
  SHOP_CART_STORAGE_KEY,
  writeShopCart,
} from "@/lib/shopCart";

export function useShopCart(shop: ShopContent) {
  const [items, setItems] = useState<ShopOrderItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const shopRef = useRef(shop);
  shopRef.current = shop;
  const catalogueKey = shop.collections
    .map((collection) => `${collection.id}:${collection.enabled}:${collection.sizes.map((size) => `${size.id}:${size.availability}`).join(",")}`)
    .join("|");

  useEffect(() => {
    const refresh = () => setItems(readShopCart(shopRef.current));
    refresh();
    setLoaded(true);
    window.addEventListener("storage", refresh);
    window.addEventListener(SHOP_CART_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(SHOP_CART_EVENT, refresh);
    };
  }, [catalogueKey]);

  const replace = useCallback(
    (next: ShopOrderItem[]) => {
      const clean = writeShopCart(shopRef.current, next);
      setItems(clean);
      return clean;
    },
    []
  );

  const add = useCallback(
    (item: ShopOrderItem) => {
      const current = readShopCart(shopRef.current);
      const index = current.findIndex(
        (entry) => entry.collectionId === item.collectionId && entry.sizeId === item.sizeId
      );
      const next = [...current];
      if (index >= 0) {
        next[index] = {
          ...next[index],
          quantity: Math.min(999, next[index].quantity + item.quantity),
        };
      } else {
        next.push(item);
      }
      return replace(next);
    },
    [replace]
  );

  const clear = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(SHOP_CART_STORAGE_KEY);
        window.dispatchEvent(new CustomEvent(SHOP_CART_EVENT, { detail: [] }));
      } catch {
        /* localStorage unavailable */
      }
    }
    setItems([]);
  }, []);

  return { items, loaded, replace, add, clear };
}

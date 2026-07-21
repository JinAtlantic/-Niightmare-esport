import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getSiteContent } from "@/lib/getContent";
import { resolveShop, type ShopContent } from "@/lib/shop";
import type { Player } from "@/lib/types";

// Public, indexable routes. /admin is intentionally excluded.
const ROUTES = ["", "/roster", "/matches", "/achievements", "/shop", "/sponsors"];
// Legal pages — indexable but low priority / rarely change.
const LEGAL_ROUTES = ["/privacy", "/terms"];

export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = await getSiteContent();
  const site = content.site as { shop?: Partial<ShopContent> } | undefined;
  const roster = content.roster as
    | {
        mlbb?: { players?: Player[] };
        efootball?: { players?: Player[] };
      }
    | undefined;
  const shop = resolveShop(site?.shop);
  const products = shop.collections.filter(
    (collection) => collection.enabled && collection.slug
  );
  const players = [
    ...(roster?.mlbb?.players ?? []),
    ...(roster?.efootball?.players ?? []),
  ].filter((player) => player.id);
  const lastModified = new Date();
  return [
    ...ROUTES.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified,
      changeFrequency: (path === "" ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: path === "" ? 1 : 0.8,
    })),
    ...LEGAL_ROUTES.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
    ...products.map((product) => ({
      url: `${SITE_URL}/shop/${encodeURIComponent(product.slug)}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...players.map((player) => ({
      url: `${SITE_URL}/roster/${encodeURIComponent(player.id)}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}

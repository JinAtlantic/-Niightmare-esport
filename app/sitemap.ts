import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Public, indexable routes. /admin is intentionally excluded.
const ROUTES = ["", "/roster", "/matches", "/sponsors"];
// Legal pages — indexable but low priority / rarely change.
const LEGAL_ROUTES = ["/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
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
  ];
}

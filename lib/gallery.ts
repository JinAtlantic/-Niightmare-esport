import type { Bilingual } from "./types";

export interface GalleryCategory {
  id: string;
  name: Bilingual;
}

export interface GalleryItem {
  id: string;
  categoryId: string;
  image: string;
  title: Bilingual;
  description: Bilingual;
  enabled: boolean;
}

export interface GalleryContent {
  page: {
    title: Bilingual;
    intro: Bilingual;
  };
  categories: GalleryCategory[];
  items: GalleryItem[];
}

export const DEFAULT_GALLERY: GalleryContent = {
  page: {
    title: { en: "GALLERY", lo: "ຄັງຮູບພາບ" },
    intro: {
      en: "Moments from competition, the team, and the community.",
      lo: "ຮວບຮວມຊ່ວງເວລາຈາກການແຂ່ງຂັນ, ທີມ ແລະ ຊຸມຊົນ.",
    },
  },
  categories: [
    { id: "team", name: { en: "Team", lo: "ທີມ" } },
    { id: "tournaments", name: { en: "Tournaments", lo: "ການແຂ່ງຂັນ" } },
    { id: "community", name: { en: "Community", lo: "ຊຸມຊົນ" } },
  ],
  items: [],
};

const bi = (value: unknown, fallback: Bilingual): Bilingual => {
  if (!value || typeof value !== "object") return fallback;
  const row = value as { en?: unknown; lo?: unknown };
  const en = typeof row.en === "string" ? row.en : fallback.en;
  const lo = typeof row.lo === "string" ? row.lo : fallback.lo;
  return { en, lo };
};

export function galleryId(value: string, fallback: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || fallback;
}

export function resolveGallery(value: unknown): GalleryContent {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const rawPage = raw.page && typeof raw.page === "object" ? raw.page as Record<string, unknown> : {};
  const categories = Array.isArray(raw.categories)
    ? raw.categories.flatMap((entry, index) => {
        if (!entry || typeof entry !== "object") return [];
        const row = entry as Record<string, unknown>;
        const id = galleryId(String(row.id ?? ""), `category-${index + 1}`);
        return [{ id, name: bi(row.name, { en: `Category ${index + 1}`, lo: `Category ${index + 1}` }) }];
      })
    : DEFAULT_GALLERY.categories;
  const knownCategory = new Set(categories.map((category) => category.id));
  const fallbackCategory = categories[0]?.id ?? "team";
  const items = Array.isArray(raw.items)
    ? raw.items.flatMap((entry, index) => {
        if (!entry || typeof entry !== "object") return [];
        const row = entry as Record<string, unknown>;
        const categoryId = String(row.categoryId ?? fallbackCategory);
        return [{
          id: String(row.id ?? `gallery-${index + 1}`),
          categoryId: knownCategory.has(categoryId) ? categoryId : fallbackCategory,
          image: typeof row.image === "string" ? row.image : "",
          title: bi(row.title, { en: "", lo: "" }),
          description: bi(row.description, { en: "", lo: "" }),
          enabled: row.enabled !== false,
        }];
      })
    : [];
  return {
    page: {
      title: bi(rawPage.title, DEFAULT_GALLERY.page.title),
      intro: bi(rawPage.intro, DEFAULT_GALLERY.page.intro),
    },
    categories: categories.length ? categories : DEFAULT_GALLERY.categories,
    items,
  };
}

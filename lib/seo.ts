import site from "@/data/site.json";
import rosterData from "@/data/roster.json";
import matchesData from "@/data/matches.json";
import type { Match, Player, StaffMember, Tournament, UpcomingMatch } from "@/lib/types";
import { sizePrice, type ShopCollection } from "@/lib/shop";
import { enabledGames, gameLabel } from "@/lib/games";

/**
 * Structured data (JSON-LD) builders. Crawlers (Google, social cards) read these
 * to render rich results: the org's identity + socials, the team's athletes, the
 * live match calendar, and shop products. Callers pass the same cached live
 * content used to server-render the page; bundled JSON remains the safe fallback.
 */

/**
 * Canonical site origin used in metadata, OG tags, and structured data. MUST
 * match the host the site is actually served on — the apex (niightmareesport.com)
 * 308-redirects to www, so canonicalising to www keeps every canonical/sitemap/
 * OG URL a direct 200 (an apex canonical/sitemap redirected, which broke Google's
 * sitemap fetch). Override with NEXT_PUBLIC_SITE_URL in Vercel if the primary
 * domain ever changes. Always trimmed of a trailing slash.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.niightmareesport.com"
).replace(/\/$/, "");

const abs = (path: string) =>
  path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

type SeoContent = Record<string, unknown> | null | undefined;

function contentSection<T>(content: SeoContent, key: string, fallback: T): T {
  return (content?.[key] as T | undefined) ?? fallback;
}

/** Every public social/contact link, de-duped, for schema `sameAs`. */
function teamSameAs(siteContent: typeof site): string[] {
  const c = siteContent.contact;
  return [c.facebook, c.youtube, c.tiktok, c.discord].filter(
    (u): u is string => Boolean(u && u.trim())
  );
}

/** Notable results, e.g. "M CHALLENGE CUP MEKONG SEASON 7 — CHAMPION (2026)". */
function teamAwards(matchesContent: typeof matchesData): string[] {
  return (matchesContent.tournaments as Tournament[]).map((tm) =>
    `${tm.name.en} — ${tm.placement.en}${tm.season ? ` (${tm.season})` : ""}`
  );
}

/** Sitewide org identity — the most valuable single piece of structured data. */
export function organizationSchema(content?: SeoContent) {
  const siteContent = contentSection(content, "site", site);
  const matchesContent = contentSection(content, "matches", matchesData);
  const awards = teamAwards(matchesContent);
  return {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    "@id": `${SITE_URL}/#organization`,
    name: "NIIGHTMARE ESPORTS",
    alternateName: "NIIGHTMARE",
    url: SITE_URL,
    logo: abs("/logo.png"),
    image: abs("/opengraph-image.png"),
    email: siteContent.contact.email,
    description:
      "Official esports organization from Lao PDR competing in Mobile Legends: Bang Bang (MLBB) and eFootball.",
    sport: ["Esports", "Mobile Legends: Bang Bang", "eFootball"],
    foundingLocation: { "@type": "Place", name: "Lao PDR" },
    areaServed: { "@type": "Country", name: "Laos" },
    ...(awards.length ? { award: awards } : {}),
    sameAs: teamSameAs(siteContent),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "NIIGHTMARE Esports",
    url: SITE_URL,
    inLanguage: ["en", "lo"],
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

/** One athlete/staff member as a schema.org Person. */
function personSchema(p: Player | StaffMember) {
  const socials = Object.values(p.socials ?? {}).filter(
    (u): u is string => Boolean(u && u.trim())
  );
  return {
    "@type": "Person",
    name: p.ign || p.name || "",
    ...(p.name && p.ign ? { alternateName: p.name } : {}),
    roleName: p.role?.en,
    ...(p.photo ? { image: abs(p.photo) } : {}),
    ...(socials.length ? { sameAs: socials } : {}),
    memberOf: { "@id": `${SITE_URL}/#organization` },
  };
}

/** The roster as a SportsTeam with its athletes + coaching staff. */
export function sportsTeamSchema(content?: SeoContent) {
  const rosterContent = contentSection(content, "roster", rosterData);
  const dynamicGames = (rosterContent as { games?: Record<string, { players?: Player[] }> }).games;
  const players: Player[] = dynamicGames
    ? Object.values(dynamicGames).flatMap((division) => division.players ?? [])
    : [
        ...(rosterContent.mlbb?.players ?? []),
        ...(rosterContent.efootball?.players ?? []),
      ] as Player[];
  const staff = rosterContent.staff as StaffMember[];
  return {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    "@id": `${SITE_URL}/#team`,
    name: "NIIGHTMARE ESPORTS",
    sport: "Esports",
    url: `${SITE_URL}/roster`,
    logo: abs("/logo.png"),
    parentOrganization: { "@id": `${SITE_URL}/#organization` },
    athlete: players.map(personSchema),
    coach: staff
      .filter((s) => /coach/i.test(s.role?.en ?? ""))
      .map(personSchema),
  };
}

/** A single fixture/result as a SportsEvent. */
function eventSchema(m: Match | UpcomingMatch, idSuffix: string, completed = false) {
  const opponent = (m.opponent || "").trim();
  const games = enabledGames(undefined, [m.game]);
  return {
    "@type": "SportsEvent",
    "@id": `${SITE_URL}/matches#${idSuffix}`,
    name: `NIIGHTMARE${opponent ? ` vs ${opponent}` : ""} — ${m.tournament.en}`,
    startDate: m.date,
    eventStatus: completed
      ? "https://schema.org/EventCompleted"
      : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: { "@type": "VirtualLocation", url: SITE_URL },
    sport: gameLabel(games, m.game),
    organizer: { "@type": "Organization", name: m.tournament.en },
    competitor: [
      { "@type": "SportsTeam", name: "NIIGHTMARE ESPORTS" },
      ...(opponent ? [{ "@type": "SportsTeam", name: opponent }] : []),
    ],
  };
}

/** Upcoming headline fixture — used on the home page. */
export function upcomingEventSchema(content?: SeoContent) {
  const siteContent = contentSection(content, "site", site);
  const upcoming = siteContent.upcomingMatch as UpcomingMatch;
  if (
    upcoming.status === "practice" ||
    !upcoming.date?.trim() ||
    !upcoming.tournament?.en?.trim()
  ) {
    return null;
  }
  return {
    "@context": "https://schema.org",
    ...eventSchema(upcoming, "upcoming", upcoming.status === "finished"),
  };
}

/** All fixtures (results + upcoming) as an ItemList of SportsEvents. */
export function matchesSchema(content?: SeoContent) {
  const matchesContent = contentSection(content, "matches", matchesData);
  const events = (matchesContent.matches as Match[]).map((m, i) =>
    eventSchema(m, m.id || `m${i}`, true)
  );
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: events.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: e,
    })),
  };
}

function productCurrencyCode(currency: string): string {
  const normalized = currency.trim().toUpperCase();
  if (/LAK|KIP|ກີບ/.test(normalized)) return "LAK";
  return /^[A-Z]{3}$/.test(normalized) ? normalized : "LAK";
}

function productAvailability(collection: ShopCollection): string {
  if (collection.sizes.some((size) => size.availability === "in_stock")) {
    return "https://schema.org/InStock";
  }
  if (collection.sizes.some((size) => size.availability === "preorder")) {
    return "https://schema.org/PreOrder";
  }
  return "https://schema.org/OutOfStock";
}

/** One admin-managed shop collection as schema.org Product + Offer data. */
export function productSchema(collection: ShopCollection) {
  const url = `${SITE_URL}/shop/${encodeURIComponent(collection.slug)}`;
  const images = [collection.productImage]
    .filter((image): image is string => Boolean(image?.trim()))
    .map(abs);
  const currency = productCurrencyCode(collection.currency);
  const availableSizes = collection.sizes.filter((size) => size.availability !== "sold_out");
  const availability = productAvailability(collection);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: collection.productName.en,
    description: collection.description.en || collection.tagline.en,
    sku: collection.id,
    url,
    ...(images.length ? { image: images } : {}),
    brand: { "@type": "Brand", name: "NIIGHTMARE Esports" },
    category: "Esports apparel",
    offers: (availableSizes.length ? availableSizes : collection.sizes).map((size) => ({
      "@type": "Offer",
      name: `${collection.productName.en} — Size ${size.label}`,
      url,
      price: sizePrice(collection, size),
      priceCurrency: currency,
      availability:
        size.availability === "sold_out"
          ? "https://schema.org/OutOfStock"
          : size.availability === "preorder"
            ? "https://schema.org/PreOrder"
            : availability,
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${SITE_URL}/#organization` },
    })),
  };
}

/** Breadcrumb trail. Pass [{ name, path }] from home → current page. */
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: abs(c.path),
    })),
  };
}

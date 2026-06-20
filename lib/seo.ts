import site from "@/data/site.json";
import rosterData from "@/data/roster.json";
import matchesData from "@/data/matches.json";
import type { Match, Player, StaffMember, Tournament, UpcomingMatch } from "@/lib/types";

/**
 * Structured data (JSON-LD) builders. Crawlers (Google, social cards) read these
 * to render rich results: the org's identity + socials, the team's athletes, and
 * the match calendar. Built from the bundled seed JSON so the schema is static,
 * fast, and always present at first byte (no blob round-trip on every request).
 */

/**
 * Canonical site origin used in metadata, OG tags, and structured data. Set
 * NEXT_PUBLIC_SITE_URL in Vercel once a custom domain is connected (e.g.
 * https://niightmare.gg) — no code change needed. Falls back to the vercel.app
 * URL. Always trimmed of a trailing slash so `${SITE_URL}/path` is clean.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://niightmare-esport.vercel.app"
).replace(/\/$/, "");

const abs = (path: string) =>
  path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

/** Every public social/contact link, de-duped, for schema `sameAs`. */
function teamSameAs(): string[] {
  const c = site.contact;
  return [c.facebook, c.youtube, c.tiktok, c.discord].filter(
    (u): u is string => Boolean(u && u.trim())
  );
}

/** Notable results, e.g. "M CHALLENGE CUP MEKONG SEASON 7 — CHAMPION (2026)". */
function teamAwards(): string[] {
  return (matchesData.tournaments as Tournament[]).map((tm) =>
    `${tm.name.en} — ${tm.placement.en}${tm.season ? ` (${tm.season})` : ""}`
  );
}

/** Sitewide org identity — the most valuable single piece of structured data. */
export function organizationSchema() {
  const awards = teamAwards();
  return {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    "@id": `${SITE_URL}/#organization`,
    name: "NIIGHTMARE ESPORTS",
    alternateName: "NIIGHTMARE",
    url: SITE_URL,
    logo: abs("/logo.png"),
    image: abs("/opengraph-image.png"),
    email: site.contact.email,
    description:
      "Official esports organization from Lao PDR competing in Mobile Legends: Bang Bang (MLBB) and eFootball.",
    sport: ["Esports", "Mobile Legends: Bang Bang", "eFootball"],
    foundingLocation: { "@type": "Place", name: "Lao PDR" },
    areaServed: { "@type": "Country", name: "Laos" },
    ...(awards.length ? { award: awards } : {}),
    sameAs: teamSameAs(),
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
export function sportsTeamSchema() {
  const players: Player[] = [
    ...rosterData.mlbb.players,
    ...rosterData.efootball.players,
  ] as Player[];
  const staff = rosterData.staff as StaffMember[];
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
function eventSchema(m: Match | UpcomingMatch, idSuffix: string) {
  const opponent = (m.opponent || "").trim();
  return {
    "@type": "SportsEvent",
    "@id": `${SITE_URL}/matches#${idSuffix}`,
    name: `NIIGHTMARE${opponent ? ` vs ${opponent}` : ""} — ${m.tournament.en}`,
    startDate: m.date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: { "@type": "VirtualLocation", url: SITE_URL },
    sport: m.game === "efootball" ? "eFootball" : "Mobile Legends: Bang Bang",
    organizer: { "@type": "Organization", name: m.tournament.en },
    competitor: [
      { "@type": "SportsTeam", name: "NIIGHTMARE ESPORTS" },
      ...(opponent ? [{ "@type": "SportsTeam", name: opponent }] : []),
    ],
  };
}

/** Upcoming headline fixture — used on the home page. */
export function upcomingEventSchema() {
  return {
    "@context": "https://schema.org",
    ...eventSchema(site.upcomingMatch as UpcomingMatch, "upcoming"),
  };
}

/** All fixtures (results + upcoming) as an ItemList of SportsEvents. */
export function matchesSchema() {
  const events = (matchesData.matches as Match[]).map((m, i) =>
    eventSchema(m, m.id || `m${i}`)
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

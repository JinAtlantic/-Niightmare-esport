import type { Match, MatchVod } from "./types";

export function cleanMatchVods(value: unknown): MatchVod[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const url = typeof row.url === "string" ? row.url.trim() : "";
      if (!url) return null;
      const type = row.type === "game" ? "game" : "series";
      const game = Number(row.game);
      return {
        type,
        ...(type === "game" && Number.isFinite(game) && game > 0 ? { game: Math.floor(game) } : {}),
        url,
      } satisfies MatchVod;
    })
    .filter((item): item is MatchVod => Boolean(item));
}

export function matchVods(match: Pick<Match, "vod" | "vods">): MatchVod[] {
  const vods = cleanMatchVods(match.vods);
  const legacy = typeof match.vod === "string" ? match.vod.trim() : "";
  if (!legacy || vods.some((vod) => vod.url === legacy)) return vods;
  return [{ type: "series", url: legacy }, ...vods];
}


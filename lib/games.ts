import type { Bilingual, GameId } from "./types";

export interface GameDefinition {
  id: GameId;
  name: Bilingual;
  shortName: string;
  enabled: boolean;
}

export const DEFAULT_GAMES: GameDefinition[] = [
  {
    id: "mlbb",
    name: { en: "Mobile Legends: Bang Bang", lo: "Mobile Legends: Bang Bang" },
    shortName: "MLBB",
    enabled: true,
  },
  {
    id: "efootball",
    name: { en: "eFootball", lo: "eFootball" },
    shortName: "eFootball",
    enabled: true,
  },
];

export function gameSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function resolveGames(value: unknown, discoveredIds: string[] = []): GameDefinition[] {
  // Once the admin has saved an explicit list, it is the source of truth.
  // Do not silently restore defaults or IDs discovered in old content: removing
  // a game should hide it without requiring destructive deletion of its history.
  const hasConfiguredGames = Array.isArray(value);
  const raw = hasConfiguredGames ? value : DEFAULT_GAMES;
  const resolved = raw
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object")
    .map((entry, index): GameDefinition | null => {
      const id = gameSlug(String(entry.id ?? ""));
      if (!id) return null;
      const fallback = DEFAULT_GAMES.find((game) => game.id === id);
      const nameValue = entry.name && typeof entry.name === "object"
        ? entry.name as { en?: unknown; lo?: unknown }
        : {};
      const en = String(nameValue.en ?? fallback?.name.en ?? id);
      const lo = String(nameValue.lo ?? fallback?.name.lo ?? en);
      return {
        id,
        name: { en, lo },
        shortName: String(entry.shortName ?? fallback?.shortName ?? en).trim().slice(0, 24) || id.toUpperCase(),
        enabled: entry.enabled !== false,
      };
    })
    .filter((entry): entry is GameDefinition => entry !== null);

  const byId = new Map<string, GameDefinition>();
  for (const game of resolved) byId.set(game.id, game);
  if (!hasConfiguredGames) {
    for (const rawId of discoveredIds) {
      const id = gameSlug(rawId);
      if (!id || byId.has(id)) continue;
      byId.set(id, {
        id,
        name: { en: rawId, lo: rawId },
        shortName: rawId.toUpperCase(),
        enabled: true,
      });
    }
  }
  return [...byId.values()];
}

export function enabledGames(value: unknown, discoveredIds: string[] = []): GameDefinition[] {
  return resolveGames(value, discoveredIds).filter((game) => game.enabled);
}

export function gameLabel(games: GameDefinition[], id: string): string {
  return games.find((game) => game.id === id)?.shortName || id.toUpperCase();
}

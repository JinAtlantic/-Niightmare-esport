/**
 * Shared NSFW verdict logic used by the server-side avatar gate (lib/nsfwServer).
 * Kept framework-free (no tfjs/DOM imports) so the thresholds live in one place,
 * separate from the model plumbing. Deliberately a bit strict for avatars.
 */
export interface NsfwVerdict {
  safe: boolean;
  label: string;
  score: number;
}

/** Turn nsfwjs class probabilities into a pass/fail verdict. */
export function evaluateNsfw(byClass: Record<string, number>): NsfwVerdict {
  const porn = byClass.Porn ?? 0;
  const hentai = byClass.Hentai ?? 0;
  const sexy = byClass.Sexy ?? 0;

  const unsafe = porn >= 0.5 || hentai >= 0.5 || sexy >= 0.8 || porn + hentai >= 0.6;

  const ranked: [string, number][] = (
    [
      ["Porn", porn],
      ["Hentai", hentai],
      ["Sexy", sexy],
    ] as [string, number][]
  ).sort((a, b) => b[1] - a[1]);

  return { safe: !unsafe, label: ranked[0][0], score: ranked[0][1] };
}

import type { Metadata } from "next";
import ObsSponsorOverlay from "@/components/clients/ObsSponsorOverlay";
import { getSiteContent } from "@/lib/getContent";
import type { Sponsor } from "@/lib/types";

export const metadata: Metadata = {
  title: "OBS Sponsor Overlay",
  robots: { index: false, follow: false },
};

export const revalidate = 60;

type OverlaySearchParams = {
  position?: string;
  mode?: string;
  sponsors?: string;
  speed?: string;
  limit?: string;
};

function cleanKey(value: string) {
  return value.trim().toLowerCase();
}

function filterSponsors(sponsors: Sponsor[], selected?: string) {
  const selectedNames = (selected ?? "")
    .split(",")
    .map(cleanKey)
    .filter(Boolean);
  if (!selectedNames.length) return sponsors;

  const selectedSet = new Set(selectedNames);
  const filtered = sponsors.filter((sponsor) => selectedSet.has(cleanKey(sponsor.name)));
  return filtered.length ? filtered : sponsors;
}

function positiveInt(value: string | undefined, fallback: number, min: number, max: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

export default async function LiveOverlayPage({
  searchParams,
}: {
  searchParams: Promise<OverlaySearchParams>;
}) {
  const params = await searchParams;
  const content = await getSiteContent();
  const sponsorsFile = content.sponsors as { sponsors?: Sponsor[] };
  const allSponsors = sponsorsFile.sponsors ?? [];
  const limit = positiveInt(params.limit, 6, 1, 12);
  const sponsors = filterSponsors(allSponsors, params.sponsors).slice(0, limit);
  const position = params.position === "top" ? "top" : "bottom";
  const mode = params.mode === "corner" ? "corner" : "bar";
  const seconds = positiveInt(params.speed, 12, 5, 60);

  return (
    <ObsSponsorOverlay
      sponsors={sponsors}
      position={position}
      mode={mode}
      seconds={seconds}
    />
  );
}

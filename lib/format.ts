import type { Lang } from "@/lib/types";

const localeFor = (lang: Lang) => (lang === "lo" ? "lo-LA" : "en-US");

/** Format an ISO date (YYYY-MM-DD) as a readable date in the active language. */
export function formatDate(iso: string, lang: Lang): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(localeFor(lang), {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/** Format an ISO datetime including time-of-day. Fixtures are Lao/Thai (+07:00)
 *  events, so the time is always rendered in Asia/Bangkok, 24-hour — the entered
 *  kickoff shows the same for every visitor regardless of their own time zone. */
export function formatDateTime(iso: string, lang: Lang): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(localeFor(lang), {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Bangkok",
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

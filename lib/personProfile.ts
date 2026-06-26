import { formatDate } from "./format";

export function countryFlag(code?: string): string | null {
  const normalized = code?.trim().toUpperCase();
  if (!normalized || !/^[A-Z]{2}$/.test(normalized)) return null;
  return String.fromCodePoint(
    ...normalized.split("").map((char) => 0x1f1e6 + char.charCodeAt(0) - 65)
  );
}

export function countryFlagImageUrl(code?: string): string | null {
  const normalized = code?.trim().toLowerCase();
  if (!normalized || !/^[a-z]{2}$/.test(normalized)) return null;
  return `https://flagcdn.com/w80/${normalized}.png`;
}

export function cleanCountryCode(code?: string): string | undefined {
  const normalized = code?.trim().toUpperCase();
  return normalized && /^[A-Z]{2}$/.test(normalized) ? normalized : undefined;
}

export function calculateAge(birthDate?: string, now = new Date()): number | null {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime()) || birth > now) return null;

  let age = now.getFullYear() - birth.getFullYear();
  const birthdayThisYear = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
  if (now < birthdayThisYear) age -= 1;
  return age >= 0 ? age : null;
}

export function formatBirthDate(birthDate: string | undefined, lang: "en" | "lo"): string | null {
  if (!birthDate) return null;
  const parsed = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return formatDate(birthDate, lang);
}

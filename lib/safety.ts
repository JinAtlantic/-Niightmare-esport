const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function publicFanName(value: unknown): string {
  const name = String(value ?? "").trim();
  if (!name || EMAIL_RE.test(name)) return "NIIGHTMARE Fan";
  return name.slice(0, 80);
}

export function publicFanAvatar(value: unknown): string {
  return safeImageSrc(String(value ?? ""), "");
}

export function safeHref(value: unknown, fallback = ""): string {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "#") return fallback;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;

  try {
    const url = new URL(raw);
    if (url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:") {
      return url.toString();
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export function safeHttpUrl(value: unknown, fallback = ""): string {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  try {
    const url = new URL(raw);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {
    return fallback;
  }
  return fallback;
}

export function safeMailto(email: unknown, fallback = ""): string {
  const value = String(email ?? "").trim();
  if (!EMAIL_RE.test(value)) return fallback;
  return `mailto:${value}`;
}

export function safeImageSrc(value: unknown, fallback = ""): string {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;

  try {
    const url = new URL(raw);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {
    return fallback;
  }

  return fallback;
}

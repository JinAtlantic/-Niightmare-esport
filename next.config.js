/** @type {import('next').NextConfig} */

// Security headers applied to every route. Tuned for a static-ish marketing
// site with self-hosted fonts, Supabase Storage and privacy-safe analytics.
const supabaseOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
      : "";
  } catch {
    return "";
  }
})();

const supabaseRealtimeOrigin = supabaseOrigin.replace(/^https:/, "wss:");
const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  [
    "script-src 'self' 'unsafe-inline'",
    isDev ? "'unsafe-eval'" : "",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://va.vercel-scripts.com",
  ]
    .filter(Boolean)
    .join(" "),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  [
    "connect-src 'self'",
    "https://www.google-analytics.com",
    "https://www.google.com",
    "https://www.googletagmanager.com",
    "https://analytics.google.com",
    "https://region1.google-analytics.com",
    "https://formspree.io",
    "https://vitals.vercel-insights.com",
    supabaseOrigin,
    supabaseRealtimeOrigin,
  ]
    .filter(Boolean)
    .join(" "),
  "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com",
  "form-action 'self' https://formspree.io",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig = {
  reactStrictMode: true,
  // Sharp loads native binaries dynamically. Include them explicitly because
  // automatic tracing can miss its platform-specific optional dependencies.
  outputFileTracingIncludes: {
    "/api/shop/order": ["./node_modules/sharp/**/*", "./node_modules/@img/**/*"],
    "/api/admin/orders": ["./node_modules/sharp/**/*", "./node_modules/@img/**/*"],
  },
  // Don't advertise the framework.
  poweredByHeader: false,
  compress: true,
  // Strip console.* in production builds (keep error/warn for observability).
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  images: {
    // Serve modern formats with automatic resizing when next/image is used.
    formats: ["image/avif", "image/webp"],
    // Allow legacy Vercel Blob art plus the current Supabase-hosted media.
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "flagcdn.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;

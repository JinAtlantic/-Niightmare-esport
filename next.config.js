/** @type {import('next').NextConfig} */

// Security headers applied to every route. Tuned for a static-ish marketing
// site that loads Google Fonts and talks to Vercel Blob.
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

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  [
    "connect-src 'self'",
    "https://www.google-analytics.com",
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
  // Don't advertise the framework.
  poweredByHeader: false,
  compress: true,
  // TensorFlow.js + nsfwjs are huge and only run server-side (the avatar NSFW
  // gate, lib/nsfwServer). They must NOT be bundled into the serverless function
  // — webpack chokes on nsfwjs's default-model shards / the minifier crashes.
  // Keep them as runtime requires from node_modules instead. (sharp is already
  // externalised by Next automatically.)
  serverExternalPackages: ["@tensorflow/tfjs", "nsfwjs"],
  // The avatar NSFW gate (lib/nsfwServer) reads the model off disk with fs at
  // runtime. Next's build tracer can't see a path built from process.cwd(), so
  // without this the model files under public/nsfw-model would be left OUT of the
  // serverless function bundle on Vercel and every avatar upload would 503. Force
  // them into the /api/community/profile function's trace.
  outputFileTracingIncludes: {
    "/api/community/profile": ["./public/nsfw-model/**"],
  },
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
    // Allow remote player/team art served from Vercel Blob.
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "flagcdn.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;

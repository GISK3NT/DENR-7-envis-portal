import type { NextConfig } from "next";

/**
 * Baseline security headers applied to every response.
 *
 * Notes:
 * - `script-src 'unsafe-inline'` is required by Next.js' inline bootstrap /
 *   flight-data scripts. All application content is rendered by React (which
 *   escapes by default) and map popups are HTML-escaped before `setHTML`.
 * - MapLibre needs blob/data workers and https tile + CDN sources.
 * - HSTS is only sent when the deployment is known to be served over HTTPS.
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

if (process.env.ENVIS_HTTPS === "1") {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  });
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // 15 MB release attachments + request attachments, with headroom.
    serverActions: { bodySizeLimit: "16mb" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Uploaded request attachments are private, never cache them.
        source: "/admin/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;

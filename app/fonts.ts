import localFont from "next/font/local";

/**
 * Field Atlas type system.
 *
 * Display: Bricolage Grotesque (variable 300–800) — editorial, tight, with
 * enough character to carry a government portal without looking ceremonial.
 * Text: Instrument Sans (variable 400–700, plus italic) — quiet and highly
 * legible at small sizes, with tabular figures for data tables.
 *
 * Both are self-hosted from /public/fonts so builds never depend on a network.
 */
export const display = localFont({
  src: "../public/fonts/bricolage-latin.woff2",
  variable: "--font-display",
  weight: "300 800",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
  adjustFontFallback: false,
});

export const text = localFont({
  src: [
    {
      path: "../public/fonts/instrument-latin.woff2",
      weight: "400 700",
      style: "normal",
    },
    {
      path: "../public/fonts/instrument-italic-latin.woff2",
      weight: "400 600",
      style: "italic",
    },
  ],
  variable: "--font-text",
  display: "swap",
  fallback: ["Segoe UI", "system-ui", "sans-serif"],
  adjustFontFallback: false,
});

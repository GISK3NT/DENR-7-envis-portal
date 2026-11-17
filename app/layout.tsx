import type { Metadata, Viewport } from "next";
import { getLocale } from "@/lib/locale";
import { getDictionary } from "@/lib/i18n";
import { display, text } from "./fonts";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getDictionary(locale);
  return {
    title: t.meta.title,
    description: t.meta.description,
    robots: { index: true, follow: true },
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "48x48" },
        { url: "/icon.png", type: "image/png", sizes: "192x192" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0B1F19",
  colorScheme: "light",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale === "fil" ? "fil" : "en-PH"} className={`${display.variable} ${text.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-forest-950 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-sand-50"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}

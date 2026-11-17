import type { Locale } from "@/lib/types";

const dateLocale: Record<Locale, string> = { en: "en-PH", fil: "fil-PH" };

export function formatDate(iso: string, locale: Locale = "en"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(dateLocale[locale], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string, locale: Locale = "en"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(dateLocale[locale], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(n: number | null | undefined, locale: Locale = "en"): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString(dateLocale[locale]);
}

export function formatExtent(extent: [number, number, number, number]): string {
  return extent.map((n) => n.toFixed(3)).join(", ");
}

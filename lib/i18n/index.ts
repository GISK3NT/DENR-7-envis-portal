import en from "./en.json";
import fil from "./fil.json";
import type { Locale } from "@/lib/types";

export const locales: Locale[] = ["en", "fil"];

export const localeLabels: Record<Locale, string> = {
  en: "English",
  fil: "Filipino",
};

const dictionaries = { en, fil };

export type Dictionary = typeof en;

export function getDictionary(locale: Locale): Dictionary {
  return (dictionaries[locale] ?? en) as Dictionary;
}

/** Pick the localized value of a bilingual field. */
export function pick<T>(value: { en: T; fil: T }, locale: Locale): T {
  return value[locale] ?? value.en;
}

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "fil";
}

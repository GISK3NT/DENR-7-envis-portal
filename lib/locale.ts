import { cookies } from "next/headers";
import type { Locale } from "@/lib/types";
import { isLocale } from "@/lib/i18n";

export const LOCALE_COOKIE = "envis_locale";

/** Read the active locale on the server. Defaults to English. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : "en";
}

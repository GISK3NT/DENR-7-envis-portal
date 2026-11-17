"use client";

import { useFormStatus } from "react-dom";
import type { Locale } from "@/lib/types";
import { locales, localeLabels } from "@/lib/i18n";
import { setLocaleAction } from "@/app/actions/locale";

function Option({ locale, active }: { locale: Locale; active: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="locale"
      value={locale}
      disabled={pending}
      aria-pressed={active}
      title={localeLabels[locale]}
      className={`rounded-[7px] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] transition ${
        active
          ? "bg-forest-900 text-sand-50 shadow-sm"
          : "text-forest-700 hover:bg-forest-100/80 hover:text-forest-950"
      }`}
    >
      {locale}
    </button>
  );
}

export default function LocaleToggle({ locale }: { locale: Locale }) {
  return (
    <form
      action={setLocaleAction}
      aria-label="Language"
      className="flex items-center gap-0.5 rounded-[9px] border border-sand-200 bg-white/80 p-0.5"
    >
      {locales.map((l) => (
        <Option key={l} locale={l} active={l === locale} />
      ))}
    </form>
  );
}

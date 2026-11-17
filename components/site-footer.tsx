import Link from "next/link";
import { Logo } from "@/components/logo";
import { getLocale } from "@/lib/locale";
import { getDictionary } from "@/lib/i18n";
import { region } from "@/lib/datasets";

export default async function SiteFooter() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-24 overflow-hidden bg-forest-950 text-sand-100">
      <div aria-hidden className="grain-overlay opacity-[0.25]" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brass-500/60 to-transparent" />

      <div className="container-gov relative py-14">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <Logo size={40} variant="static" />
              <span className="flex flex-col">
                <span className="font-display text-xl font-semibold leading-none tracking-tightest text-sand-50">
                  {t.brand.name}
                </span>
                <span className="mt-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-forest-300">
                  {t.brand.sub}
                </span>
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-sand-200/70">{t.footer.blurb}</p>
            <p className="mt-5 flex max-w-sm items-start gap-2.5 rounded-[10px] border border-brass-400/25 bg-brass-400/[0.07] px-3 py-2.5 text-xs leading-relaxed text-brass-200">
              <span aria-hidden className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-brass-400" />
              {t.footer.demo_notice}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-forest-400">
              {t.footer.links}
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { href: "/datasets", label: t.nav.catalog },
                { href: "/lcm-analysis", label: "LCM Analysis" },
                { href: "/geohazards-maps", label: "Geohazard Maps" },
                { href: "/#themes", label: t.nav.categories },
                { href: "/about", label: t.nav.about },
                { href: "/admin", label: t.nav.admin, muted: true },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`underline-grow text-[13.5px] transition-colors ${
                      item.muted
                        ? "text-forest-400 hover:text-sand-100"
                        : "text-sand-200/80 hover:text-sand-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.18em] text-forest-400">
              {t.nav.public_dashboards}
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { href: "https://2ab60a69.envis-public-dashboard.pages.dev/#/map", label: t.nav.emb_public },
                {
                  href: "https://geocheckcentralvisayas-bit.github.io/PUBLIC-SERVICE-ADVISORY-AQMS/",
                  label: t.nav.aqms,
                },
              ].map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-grow inline-flex items-start gap-1.5 text-[13.5px] text-sand-200/80 transition-colors hover:text-sand-50"
                  >
                    {item.label}
                    <svg
                      aria-hidden
                      viewBox="0 0 12 12"
                      className="mt-1 h-2.5 w-2.5 shrink-0 text-forest-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4.5 2.5h5v5" />
                      <path d="M9.5 2.5 3 9" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-forest-400">
              {t.footer.legal}
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/terms" className="underline-grow text-[13.5px] text-sand-200/80 transition-colors hover:text-sand-50">
                  {t.nav.terms}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="underline-grow text-[13.5px] text-sand-200/80 transition-colors hover:text-sand-50">
                  {t.privacy.title}
                </Link>
              </li>
            </ul>

            <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.18em] text-forest-400">
              {t.footer.contact}
            </p>
            <p className="mt-3 max-w-[16rem] text-[13px] leading-relaxed text-sand-200/70">{t.footer.address}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-sand-200/80">
              <a href="mailto:geocheckcentralvisayas@gmail.com" className="underline-grow hover:text-sand-50">
                geocheckcentralvisayas@gmail.com
              </a>
            </p>
            <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.12em] text-forest-300">
              {locale === "fil" ? region.fil : region.en} · Region {region.code}
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-forest-800/80 pt-6 text-[11px] text-forest-400 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl leading-relaxed">
            © {year} Department of Environment and Natural Resources. {t.footer.rights}
          </p>
          <p className="shrink-0 uppercase tracking-[0.16em]">ENVIS · Region VII</p>
        </div>
      </div>
    </footer>
  );
}

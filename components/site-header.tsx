import Link from "next/link";
import { Logo } from "@/components/logo";
import LocaleToggle from "@/components/locale-toggle";
import SiteNav from "@/components/site-nav";
import PublicDashboardsMenu from "@/components/public-dashboards-menu";
import { getLocale } from "@/lib/locale";
import { getDictionary } from "@/lib/i18n";

export default async function SiteHeader() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  const links = [
    { href: "/datasets", label: t.nav.catalog },
    { href: "/lcm-analysis", label: locale === "fil" ? "LCM Analysis" : "LCM Analysis" },
    { href: "/geohazards-maps", label: locale === "fil" ? "Geohazard Maps" : "Geohazard Maps" },
    { href: "/#themes", label: t.nav.categories },
    { href: "/about", label: t.nav.about },
    { href: "/terms", label: t.nav.terms },
  ];

  // External portals: shown individually in the scrollable mobile strip, and
  // grouped in a dropdown on desktop so the main navigation stays on one line.
  const dashboards = [
    {
      href: "https://2ab60a69.envis-public-dashboard.pages.dev/#/map",
      label: t.nav.emb_public,
      description: t.nav.emb_public_desc,
    },
    {
      href: "https://geocheckcentralvisayas-bit.github.io/PUBLIC-SERVICE-ADVISORY-AQMS/",
      label: t.nav.aqms,
      description: t.nav.aqms_desc,
    },
  ];

  const mobileLinks = [
    ...links,
    ...dashboards.map((item) => ({ href: item.href, label: item.label, external: true, title: item.description })),
  ];


  return (
    <header className="sticky top-0 z-40">
      {/* Utility strip — republic line, keeps the portal anchored in government */}
      <div className="hidden bg-forest-950 text-sand-200/90 md:block">
        <div className="container-gov flex h-8 items-center justify-between gap-6 text-[10px] font-medium uppercase tracking-[0.18em]">
          <p className="truncate">{t.brand.full}</p>
          <p className="flex shrink-0 items-center gap-3">
            <span className="h-1 w-1 rounded-full bg-brass-400" aria-hidden />
            {t.brand.sub}
          </p>
        </div>
      </div>

      <div className="border-b border-sand-200 bg-sand-50/85 backdrop-blur-md supports-[backdrop-filter]:bg-sand-50/70">
        <div className="container-gov flex h-[68px] items-center gap-5">
          <Link href="/" className="group flex shrink-0 items-center gap-3">
            <Logo size={44} />
            <span className="flex flex-col justify-center">
              <span className="font-display text-[22px] font-semibold leading-none tracking-tightest text-forest-950 transition-colors group-hover:text-forest-800">
                {t.brand.name}
              </span>
              <span className="mt-1.5 flex items-center gap-1.5">
                <span aria-hidden className="block h-px w-4 bg-brass-500" />
                <span className="text-[9.5px] font-semibold uppercase leading-none tracking-[0.14em] text-forest-600">
                  {t.brand.sub}
                </span>
              </span>
            </span>
          </Link>

          <nav aria-label="Main" className="ml-auto hidden items-center gap-0.5 xl:flex">
            <SiteNav links={links} />
            <span aria-hidden className="mx-1 h-4 w-px bg-sand-300" />
            <PublicDashboardsMenu
              label={t.nav.public_dashboards}
              hint={t.nav.public_dashboards_hint}
              items={dashboards}
            />
          </nav>

          <div className="ml-auto flex items-center gap-2.5 md:ml-4">
            <span
              className="hidden items-center gap-1.5 rounded-[6px] border border-brass-200 bg-brass-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-brass-700 lg:inline-flex"
              title={t.footer.demo_notice}
            >
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brass-500" />
              Preview
            </span>
            <LocaleToggle locale={locale} />
          </div>
        </div>

        <nav
          aria-label="Main mobile"
          className="flex gap-1 overflow-x-auto border-t border-sand-200 px-4 py-2 [mask-image:linear-gradient(to_right,#000_calc(100%-32px),transparent)] xl:hidden"
        >
          <SiteNav links={mobileLinks} variant="mobile" />
        </nav>
      </div>
    </header>
  );
}

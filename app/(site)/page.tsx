import Link from "next/link";
import { getLocale } from "@/lib/locale";
import { getDictionary, pick } from "@/lib/i18n";
import { countByCategory, getCategories, getDatasets, getFeatured, getProvinces, region } from "@/lib/datasets";
import PreviewMap from "@/components/preview-map";
import GeometryIcon from "@/components/geometry-icon";
import { categoryColor } from "@/lib/style";
import { formatDate } from "@/lib/format";

export default async function HomePage() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const datasets = getDatasets();
  const categories = getCategories();
  const counts = countByCategory();
  const featured = getFeatured(3);
  const provinces = getProvinces();

  const stats = [
    { value: String(datasets.length), label: t.home.stat_datasets },
    { value: String(provinces.length), label: t.home.stat_provinces },
    { value: String(categories.length), label: t.home.stat_themes },
    { value: t.home.stat_delivery_value, label: t.home.stat_delivery, small: true },
  ];

  const steps = [
    { n: "01", title: t.home.how_1_title, body: t.home.how_1_body },
    { n: "02", title: t.home.how_2_title, body: t.home.how_2_body },
    { n: "03", title: t.home.how_3_title, body: t.home.how_3_body },
    { n: "04", title: t.home.how_4_title, body: t.home.how_4_body },
  ];

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden border-b border-sand-200">
        <div aria-hidden className="topo-field absolute inset-0 mask-fade-b opacity-60" />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-48 h-[34rem] w-[34rem] rounded-full bg-forest-200/25 blur-3xl"
        />

        <div className="container-gov relative">
          <div className="grid items-end gap-10 pb-12 pt-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:pb-14 lg:pt-16">
            <div>
              <p className="eyebrow-rule reveal">{t.home.eyebrow}</p>

              <h1
                className="reveal mt-6 max-w-[15ch] text-balance font-display text-[clamp(2.45rem,5vw,4.15rem)] font-semibold leading-[0.95] tracking-tightest text-forest-950"
                style={{ "--d": "60ms" } as React.CSSProperties}
              >
                {t.home.title}
              </h1>

              <p
                className="reveal mt-6 max-w-[46ch] text-[15px] leading-7 text-forest-800/80"
                style={{ "--d": "140ms" } as React.CSSProperties}
              >
                {t.home.subtitle}
              </p>

              <div
                className="reveal mt-8 flex flex-wrap items-center gap-x-3 gap-y-3"
                style={{ "--d": "220ms" } as React.CSSProperties}
              >
                <Link href="/datasets" className="btn-primary group">
                  {t.home.cta_primary}
                  <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <Link href="#how" className="btn-secondary">
                  {t.home.cta_secondary}
                </Link>
                <Link
                  href="/terms"
                  className="btn-link ml-1 hidden sm:inline-flex"
                >
                  {t.nav.terms}
                </Link>
              </div>
            </div>

            {/* Map plate */}
            <div className="reveal relative" style={{ "--d": "180ms" } as React.CSSProperties}>
              <div className="rounded-card border border-sand-300 bg-white p-2 shadow-lift">
                <PreviewMap
                  src="/previews/provincial-boundaries-r7.geojson"
                  geometry="polygon"
                  height={404}
                  color="#274A3B"
                  label={`${region.en} coverage map`}
                  padding={36}
                  className="!rounded-[13px] !border-0"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 pb-1.5 pt-3">
                  <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-forest-700">
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brass-500" />
                    {region.en} · Region {region.code}
                  </p>
                  <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-forest-500">
                    {provinces.map((p) => (locale === "fil" ? p.fil : p.en)).join(" · ")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stat rail */}
          <dl className="grid grid-cols-2 border-t border-sand-300 sm:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="border-b border-sand-200 py-5 pr-4 sm:border-b-0 sm:border-r sm:pl-5 sm:first:pl-0 sm:last:border-r-0"
              >
                <dd
                  className={`font-display font-semibold tracking-tightest text-forest-950 ${
                    s.small ? "text-[22px] leading-tight" : "text-[34px] leading-none"
                  } tabular-nums`}
                >
                  {s.value}
                </dd>
                <dt className="mt-2 text-[10px] font-medium uppercase leading-snug tracking-[0.12em] text-forest-600">
                  {s.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* -------------------------------------------------------------- Notice */}
      <section className="border-b border-brass-200/70 bg-brass-50/50">
        <div className="container-gov flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:gap-5">
          <p className="flex shrink-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-brass-700">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path
                d="M12 9v4m0 4h.01M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t.home.notice_title}
          </p>
          <p className="max-w-3xl text-[13px] leading-6 text-forest-800/85">{t.home.notice_body}</p>
        </div>
      </section>

      {/* ---------------------------------------------------------- How it works */}
      <section id="how" className="container-gov scroll-mt-28 py-16 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow-rule">01 — 04</p>
            <h2 className="mt-4 max-w-[22ch] font-display text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.05] tracking-tight text-forest-950">
              {t.home.how_title}
            </h2>
          </div>
          <Link href="/terms" className="btn-link">
            {t.nav.terms}
            <span aria-hidden>→</span>
          </Link>
        </div>

        <ol className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <li key={step.n} className="group border-t border-sand-300 pt-4 transition-colors hover:border-forest-700">
              <span className="font-display text-[13px] font-semibold tabular-nums tracking-[0.1em] text-brass-600">
                {step.n}
              </span>
              <h3 className="mt-3 font-display text-[17px] font-semibold leading-tight text-forest-950">
                {step.title}
              </h3>
              <p className="mt-2 max-w-[34ch] text-[13px] leading-6 text-forest-800/75">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* -------------------------------------------------------------- Themes */}
      <section id="themes" className="scroll-mt-28 border-y border-sand-200 bg-white/55 py-16 lg:py-20">
        <div className="container-gov grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow-rule">{t.nav.categories}</p>
            <h2 className="mt-4 max-w-[16ch] font-display text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.05] tracking-tight text-forest-950">
              {t.home.categories_title}
            </h2>
            <p className="mt-4 max-w-[36ch] text-[13.5px] leading-6 text-forest-700/80">
              {t.catalog.subtitle}
            </p>
            <Link href="/datasets" className="btn-secondary btn-sm mt-6">
              {t.nav.catalog}
              <span aria-hidden>→</span>
            </Link>
          </div>

          <ul className="divide-y divide-sand-200 border-y border-sand-200">
            {categories.map((category) => {
              const count = counts[category.id] ?? 0;
              return (
                <li key={category.id}>
                  <Link
                    href={`/datasets?category=${category.id}`}
                    className="group flex items-start gap-4 py-4 transition-colors hover:bg-sand-50/80 sm:items-center sm:gap-6 sm:px-2"
                  >
                    <span
                      aria-hidden
                      className="mt-1 h-9 w-[3px] shrink-0 rounded-full transition-all duration-300 group-hover:h-12"
                      style={{ backgroundColor: categoryColor[category.id] }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="font-display text-[17px] font-semibold text-forest-950">
                          {locale === "fil" ? category.fil : category.en}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-forest-500 tabular-nums">
                          {count} {count === 1 ? t.catalog.results_one : t.catalog.results_many}
                        </span>
                      </span>
                      <span className="mt-1 block max-w-[52ch] text-[13px] leading-6 text-forest-700/75">
                        {pick(category.blurb, locale)}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className="mt-1 shrink-0 text-forest-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-forest-800"
                    >
                      →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------ Featured */}
      <section className="container-gov py-16 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow-rule">{t.home.featured_body}</p>
            <h2 className="mt-4 font-display text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.05] tracking-tight text-forest-950">
              {t.home.featured_title}
            </h2>
          </div>
          <Link href="/datasets" className="btn-secondary btn-sm">
            {t.nav.catalog}
            <span aria-hidden>→</span>
          </Link>
        </div>

        <ul className="mt-10 divide-y divide-sand-200 border-y border-sand-200">
          {featured.map((dataset) => {
            const category = categories.find((c) => c.id === dataset.category);
            return (
              <li key={dataset.slug}>
                <Link
                  href={`/datasets/${dataset.slug}`}
                  className="group grid gap-3 py-6 transition-colors hover:bg-sand-50/70 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8 sm:px-2"
                >
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-forest-500">
                      <span
                        className="rounded-[4px] px-1.5 py-0.5 text-forest-900"
                        style={{ backgroundColor: `${categoryColor[dataset.category]}1a` }}
                      >
                        {category ? (locale === "fil" ? category.fil : category.en) : dataset.category}
                      </span>
                      <span className="tabular-nums">{formatDate(dataset.lastUpdated, locale)}</span>
                    </p>
                    <h3 className="mt-2.5 font-display text-[20px] font-semibold leading-snug tracking-tight text-forest-950 transition-colors group-hover:text-forest-800">
                      {pick(dataset.title, locale)}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 max-w-[68ch] text-[13.5px] leading-6 text-forest-700/80">
                      {pick(dataset.summary, locale)}
                    </p>
                  </div>
                  <span className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-forest-600 sm:justify-end">
                    <span className="hidden items-center gap-1.5 sm:flex">
                      <GeometryIcon type={dataset.geometryType} className="h-3.5 w-3.5" />
                      {t.common[dataset.geometryType]}
                    </span>
                    <span
                      aria-hidden
                      className="grid h-9 w-9 place-items-center rounded-full border border-sand-300 text-forest-700 transition-all duration-300 group-hover:border-forest-800 group-hover:bg-forest-900 group-hover:text-sand-50"
                    >
                      →
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ----------------------------------------------------------------- CTA */}
      <section className="container-gov pb-4">
        <div className="relative overflow-hidden rounded-card bg-forest-950 px-6 py-14 sm:px-14">
          <div aria-hidden className="topo-field absolute inset-0 opacity-25" />
          <div aria-hidden className="grain-overlay opacity-20" />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brass-400/10 blur-3xl"
          />

          <div className="relative max-w-2xl">
            <p className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-brass-300">
              <span aria-hidden className="block h-px w-8 bg-brass-400" />
              {t.dataset.access_title}
            </p>
            <h2 className="mt-4 font-display text-[clamp(1.85rem,3.4vw,2.75rem)] font-semibold leading-[1.02] tracking-tight text-sand-50">
              {t.home.cta_title}
            </h2>
            <p className="mt-4 max-w-[54ch] text-[14px] leading-7 text-sand-200/75">{t.home.cta_body}</p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/datasets" className="btn bg-sand-50 text-forest-950 hover:-translate-y-0.5 hover:bg-white">
                {t.home.cta_primary}
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/about"
                className="btn border border-forest-600/80 text-sand-100 hover:-translate-y-0.5 hover:border-forest-500 hover:bg-forest-900"
              >
                {t.nav.about}
              </Link>
            </div>

            <p className="mt-8 flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-forest-400">
              <GeometryIcon type="polygon" className="h-3.5 w-3.5" />
              {t.dataset.access_point_2}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

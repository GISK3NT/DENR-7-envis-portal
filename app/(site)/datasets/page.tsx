import type { Metadata } from "next";
import { getLocale } from "@/lib/locale";
import { getDictionary } from "@/lib/i18n";
import { getCategories, getDatasets, getProvinces } from "@/lib/datasets";
import CatalogBrowser from "@/components/catalog-browser";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getDictionary(locale);
  return { title: `${t.catalog.title} · ENVIS` };
}

export default async function DatasetsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [{ category }, locale] = await Promise.all([searchParams, getLocale()]);
  const t = getDictionary(locale);

  // Never ship the local source path to the browser.
  const datasets = getDatasets().map((dataset) =>
    dataset.source.kind === "local" ? { ...dataset, source: { ...dataset.source, reference: "" } } : dataset,
  );

  return (
    <div className="relative">
      <div aria-hidden className="topo-field absolute inset-x-0 top-0 h-64 opacity-40 mask-fade-b" />

      <div className="container-gov relative pb-16 pt-12 lg:pt-16">
        <div className="flex flex-wrap items-end justify-between gap-8 border-b border-sand-300 pb-8">
          <div className="max-w-2xl">
            <p className="eyebrow-rule">Region VII · Central Visayas</p>
            <h1 className="mt-4 text-balance font-display text-[clamp(2rem,4vw,3.1rem)] font-semibold leading-[1] tracking-tightest text-forest-950">
              {t.catalog.title}
            </h1>
            <p className="mt-4 max-w-[52ch] text-[14.5px] leading-7 text-forest-800/80">{t.catalog.subtitle}</p>
          </div>

          <dl className="flex gap-8">
            <div>
              <dd className="font-display text-[26px] font-semibold leading-none tabular-nums text-forest-950">
                {datasets.length}
              </dd>
              <dt className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-forest-600">
                {t.home.stat_datasets}
              </dt>
            </div>
            <div>
              <dd className="font-display text-[26px] font-semibold leading-none tabular-nums text-forest-950">
                {getCategories().length}
              </dd>
              <dt className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-forest-600">
                {t.home.stat_themes}
              </dt>
            </div>
          </dl>
        </div>

        <div className="mt-8">
          <CatalogBrowser
            datasets={datasets}
            categories={getCategories()}
            provinces={getProvinces()}
            locale={locale}
            t={t}
            initialCategory={category}
          />
        </div>
      </div>
    </div>
  );
}

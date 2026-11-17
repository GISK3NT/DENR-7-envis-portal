import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLocale } from "@/lib/locale";
import { getDictionary, pick } from "@/lib/i18n";
import { getCategory, getDataset, getProvince, relatedDatasets } from "@/lib/datasets";
import { formatDate, formatExtent, formatNumber } from "@/lib/format";
import { categoryTint } from "@/lib/style";
import GeometryIcon from "@/components/geometry-icon";
import DatasetCard from "@/components/dataset-card";
import DatasetPreviewTabs from "@/components/dataset-preview-tabs";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const dataset = getDataset(slug);
  const locale = await getLocale();
  const t = getDictionary(locale);
  if (!dataset) return { title: "Dataset not found · ENVIS" };
  return { title: `${pick(dataset.title, locale)} · ${t.brand.name}`, description: pick(dataset.summary, locale) };
}

export default async function DatasetPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const dataset = getDataset(slug);
  if (!dataset) notFound();

  const locale = await getLocale();
  const t = getDictionary(locale);
  const category = getCategory(dataset.category);
  const related = relatedDatasets(dataset);

  const meta = [
    { label: t.dataset.publisher, value: dataset.publisher },
    { label: t.dataset.steward, value: dataset.steward },
    { label: t.dataset.geometry, value: t.common[dataset.geometryType], icon: true },
    { label: t.dataset.features, value: formatNumber(dataset.featureCount, locale) },
    { label: t.dataset.crs, value: dataset.crs },
    { label: t.dataset.extent, value: formatExtent(dataset.extent), mono: true },
    { label: t.dataset.updated, value: formatDate(dataset.lastUpdated, locale) },
    { label: t.dataset.frequency, value: dataset.updateFrequency },
    {
      label: t.dataset.license,
      value: dataset.license.url ? (
        <Link href={dataset.license.url} className="underline underline-offset-2 hover:text-forest-700">
          {dataset.license.name}
        </Link>
      ) : (
        dataset.license.name
      ),
    },
    {
      label: t.dataset.source,
      value:
        dataset.source.kind === "public-arcgis"
          ? "DENR public geospatial service"
          : "Held locally by DENR Region VII",
    },
  ];

  return (
    <div className="container-gov py-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] font-medium text-forest-600">
        <Link href="/datasets" className="transition hover:text-forest-950">
          {t.nav.catalog}
        </Link>
        <span aria-hidden className="text-sand-400">/</span>
        <span className="text-forest-800">{pick(dataset.title, locale)}</span>
      </nav>

      <header className="mt-5 flex flex-col gap-6 border-b border-sand-300 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            {category ? (
              <Link
                href={`/datasets?category=${category.id}`}
                className={`badge px-2.5 py-1 tracking-[0.1em] ${categoryTint[category.id]}`}
              >
                {locale === "fil" ? category.fil : category.en}
              </Link>
            ) : null}
            {dataset.isDemo ? (
              <span className="badge-warn">{t.dataset.sample_badge}</span>
            ) : (
              <span className="badge-forest">{t.dataset.public_badge}</span>
            )}
            <span className="badge-outline">{dataset.crs}</span>
          </div>

          <h1 className="mt-4 text-balance font-display text-[clamp(1.9rem,3.6vw,2.9rem)] font-semibold leading-[1.03] tracking-tightest text-forest-950">
            {pick(dataset.title, locale)}
          </h1>
          <p className="mt-4 max-w-[62ch] text-[14.5px] leading-7 text-forest-800/80">
            {pick(dataset.summary, locale)}
          </p>
        </div>

        <div className="shrink-0 lg:w-64">
          <Link href={`/request/${dataset.slug}`} className="btn-primary group w-full">
            {t.dataset.access_cta}
            <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
          <p className="mt-2.5 text-center text-[10.5px] leading-snug text-forest-600">{t.dataset.access_point_3}</p>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Main column */}
        <div className="space-y-6">
          {dataset.preview ? <DatasetPreviewTabs dataset={dataset} locale={locale} t={t} /> : null}

          {dataset.isDemo ? (
            <div className="rounded-[10px] border border-brass-200 bg-brass-50 px-4 py-3 text-sm text-brass-700">
              {t.dataset.demo_note}
            </div>
          ) : null}

          <section className="card p-6">
            <h2 className="font-display text-xl font-semibold text-forest-950">{t.dataset.overview}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-forest-900/85">{pick(dataset.description, locale)}</p>

            <dl className="mt-5 flex flex-wrap gap-2">
              {dataset.tags.map((tag) => (
                <span key={tag} className="badge-outline normal-case tracking-normal">
                  #{tag}
                </span>
              ))}
            </dl>
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-forest-100 px-6 py-4">
              <h2 className="font-display text-xl font-semibold text-forest-950">{t.dataset.dictionary}</h2>
              <p className="mt-1 text-xs text-forest-600">
                {dataset.fields.length} {locale === "fil" ? "field" : "fields"}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-sand-100/80 text-left text-[10px] uppercase tracking-[0.12em] text-forest-700">
                  <tr>
                    <th className="px-6 py-2.5 font-semibold">{t.dataset.field}</th>
                    <th className="px-4 py-2.5 font-semibold">{t.dataset.alias}</th>
                    <th className="px-4 py-2.5 font-semibold">{t.dataset.type}</th>
                    <th className="px-6 py-2.5 font-semibold">{t.dataset.domain}</th>
                  </tr>
                </thead>
                <tbody>
                  {dataset.fields.map((field) => (
                    <tr key={field.name} className="border-t border-forest-50">
                      <td className="px-6 py-3 font-mono text-xs text-forest-900">{field.name}</td>
                      <td className="px-4 py-3 text-forest-800">{field.alias}</td>
                      <td className="px-4 py-3 text-xs uppercase tracking-wide text-forest-600">{field.type}</td>
                      <td className="px-6 py-3">
                        {field.domain?.length ? (
                          <span className="flex flex-wrap gap-1">
                            {field.domain.map((v) => (
                              <span key={v} className="rounded-md bg-forest-50 px-1.5 py-0.5 text-[11px] text-forest-800">
                                {v}
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span className="text-forest-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="font-display text-xl font-semibold text-forest-950">{t.dataset.citation}</h2>
            <p className="mt-3 rounded-[10px] border border-sand-200 bg-sand-50 px-4 py-3.5 font-mono text-[11.5px] leading-6 text-forest-900">
              {dataset.citation}
            </p>
          </section>
        </div>

        {/* Side column */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="overflow-hidden rounded-card bg-forest-950 text-sand-100 shadow-card">
            <div className="border-b border-forest-800/80 px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brass-300">
                {t.dataset.access_title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-forest-100/85">{t.dataset.access_body}</p>
            </div>
            <ul className="space-y-2.5 px-5 py-4 text-xs leading-relaxed">
              {[t.dataset.access_point_1, t.dataset.access_point_2, t.dataset.access_point_3].map((point) => (
                <li key={point} className="flex gap-2">
                  <span className="mt-0.5 text-forest-400" aria-hidden>
                    ✓
                  </span>
                  <span className="text-forest-100/85">{point}</span>
                </li>
              ))}
            </ul>
            <div className="px-5 pb-5">
              <Link href={`/request/${dataset.slug}`} className="btn w-full bg-sand-50 text-forest-950 hover:bg-white">
                {t.dataset.access_cta}
              </Link>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="font-display text-base font-semibold text-forest-950">{t.dataset.metadata}</h2>
            <dl className="mt-3 divide-y divide-forest-50 text-sm">
              {meta.map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-4 py-2.5">
                  <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-forest-600">{row.label}</dt>
                  <dd
                    className={`text-right text-forest-900 ${row.mono ? "font-mono text-[11px]" : ""} ${
                      row.icon ? "flex items-center justify-end gap-1.5" : ""
                    }`}
                  >
                    {row.icon ? <GeometryIcon type={dataset.geometryType} className="h-3.5 w-3.5" /> : null}
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="font-display text-base font-semibold text-forest-950">{t.dataset.provinces}</h2>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {dataset.provinces.map((id) => {
                const province = getProvince(id);
                return (
                  <li key={id} className="badge-outline normal-case tracking-normal">
                    {province ? (locale === "fil" ? province.fil : province.en) : id}
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>

      {related.length ? (
        <section className="mt-14">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-bold text-forest-950">{t.dataset.related}</h2>
            <Link href={`/datasets?category=${dataset.category}`} className="text-sm font-semibold text-forest-700 hover:underline">
              {t.nav.catalog} →
            </Link>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((d) => (
              <DatasetCard key={d.slug} dataset={d} locale={locale} t={t} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

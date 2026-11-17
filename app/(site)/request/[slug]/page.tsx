import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getDataset } from "@/lib/datasets";
import { getLocale } from "@/lib/locale";
import { getDictionary, pick } from "@/lib/i18n";
import { formatDate, formatNumber } from "@/lib/format";
import RequestForm from "@/components/request-form";
import GeometryIcon from "@/components/geometry-icon";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const t = getDictionary(locale);
  const dataset = getDataset(slug);
  return { title: `${t.request.title} · ${dataset ? pick(dataset.title, locale) : "ENVIS"}` };
}

export default async function RequestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dataset = getDataset(slug);
  if (!dataset) notFound();

  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <div className="container-gov py-8">
      <nav aria-label="Breadcrumb" className="text-xs font-medium text-forest-600">
        <Link href="/datasets" className="hover:text-forest-900">
          {t.nav.catalog}
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/datasets/${dataset.slug}`} className="hover:text-forest-900">
          {pick(dataset.title, locale)}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-forest-800">{t.request.title}</span>
      </nav>

      <div className="mt-4 max-w-2xl">
        <h1 className="text-3xl font-bold text-forest-950 sm:text-4xl">{t.request.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-forest-800/80">{t.request.subtitle}</p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <RequestForm slug={dataset.slug} title={pick(dataset.title, locale)} t={t} />

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-forest-600">
              {t.request.section_dataset}
            </p>
            <h2 className="mt-2 font-display text-lg font-semibold leading-snug text-forest-950">
              {pick(dataset.title, locale)}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-forest-800/80">{pick(dataset.summary, locale)}</p>

            <dl className="mt-4 space-y-2 border-t border-forest-50 pt-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-forest-600">{t.dataset.geometry}</dt>
                <dd className="flex items-center gap-1.5 font-medium text-forest-900">
                  <GeometryIcon type={dataset.geometryType} className="h-3.5 w-3.5" />
                  {t.common[dataset.geometryType]}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-forest-600">{t.dataset.features}</dt>
                <dd className="font-medium text-forest-900">{formatNumber(dataset.featureCount, locale)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-forest-600">{t.dataset.crs}</dt>
                <dd className="font-mono text-[11px] text-forest-900">{dataset.crs}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-forest-600">{t.dataset.updated}</dt>
                <dd className="font-medium text-forest-900">{formatDate(dataset.lastUpdated, locale)}</dd>
              </div>
            </dl>

            <Link href={`/datasets/${dataset.slug}`} className="btn-secondary btn-sm mt-4 w-full">
              {t.common.view}
            </Link>
          </div>

          {dataset.isDemo ? (
            <div className="rounded-[10px] border border-brass-200 bg-brass-50 px-4 py-3 text-xs leading-relaxed text-brass-700">
              {t.dataset.demo_note}
            </div>
          ) : null}

          <div className="rounded-[10px] border border-sand-200 bg-white/70 px-4 py-3 text-xs leading-relaxed text-forest-700">
            {t.dataset.access_point_3}
          </div>
        </aside>
      </div>
    </div>
  );
}

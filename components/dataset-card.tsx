import Link from "next/link";
import type { Dataset, Locale } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import { formatDate, formatNumber } from "@/lib/format";
import { getCategory } from "@/lib/datasets";
import { categoryColor } from "@/lib/style";
import GeometryIcon from "@/components/geometry-icon";

export default function DatasetCard({
  dataset,
  locale,
  t,
}: {
  dataset: Dataset;
  locale: Locale;
  t: Dictionary;
}) {
  const category = getCategory(dataset.category);
  const accent = categoryColor[dataset.category] ?? "#274A3B";

  return (
    <Link
      href={`/datasets/${dataset.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-card border border-sand-200 bg-white/80 p-5 transition duration-300 ease-out hover:-translate-y-1 hover:border-forest-300 hover:bg-white hover:shadow-lift"
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100"
        style={{ backgroundColor: accent }}
      />

      {dataset.preview ? (
        <div className="relative -mx-5 -mt-5 mb-4 overflow-hidden border-b border-sand-200 bg-sand-100">
          <div className="aspect-[16/10] w-full">
            <img
              src={dataset.preview.thumb ?? dataset.preview.file}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain p-3 opacity-90 transition duration-500 ease-out group-hover:scale-[1.03] group-hover:opacity-100"
              style={{ backgroundColor: "#F4F1E6" }}
            />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/60 to-transparent"
          />
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-forest-600">
          <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
          <span className="truncate">{category ? (locale === "fil" ? category.fil : category.en) : dataset.category}</span>
        </span>
        <span
          className="flex shrink-0 items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-forest-500"
          title={dataset.isDemo ? t.dataset.sample_badge : t.dataset.public_badge}
        >
          <span
            aria-hidden
            className={`h-1.5 w-1.5 rounded-full ${dataset.isDemo ? "bg-brass-400" : "bg-forest-400"}`}
          />
          <span className="sr-only">{dataset.isDemo ? t.dataset.sample_badge : t.dataset.public_badge}</span>
        </span>
      </div>

      <h3 className="mt-3.5 font-display text-[19px] font-semibold leading-[1.25] tracking-tight text-forest-950 transition-colors group-hover:text-forest-800">
        {pick(dataset.title, locale)}
      </h3>
      <p className="mt-2 line-clamp-3 text-[13px] leading-6 text-forest-700/85">{pick(dataset.summary, locale)}</p>

      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-sand-200 pt-3.5 text-[10px]">
        <div>
          <dt className="uppercase tracking-[0.1em] text-forest-500">{t.dataset.geometry}</dt>
          <dd className="mt-1 flex items-center gap-1.5 font-semibold text-forest-900">
            <GeometryIcon type={dataset.geometryType} className="h-3 w-3 text-forest-500" />
            {t.common[dataset.geometryType]}
          </dd>
        </div>
        <div>
          <dt className="uppercase tracking-[0.1em] text-forest-500">{t.dataset.features}</dt>
          <dd className="mt-1 font-semibold tabular-nums text-forest-900">
            {formatNumber(dataset.featureCount, locale)}
          </dd>
        </div>
        <div>
          <dt className="uppercase tracking-[0.1em] text-forest-500">{t.dataset.updated}</dt>
          <dd className="mt-1 font-semibold tabular-nums text-forest-900">{formatDate(dataset.lastUpdated, locale)}</dd>
        </div>
      </dl>

      <span
        aria-hidden
        className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-forest-800 opacity-0 transition-all duration-300 group-hover:opacity-100"
      >
        {t.common.view}
        <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
      </span>
    </Link>
  );
}

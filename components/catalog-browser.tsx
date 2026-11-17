"use client";

import { useMemo, useState } from "react";
import type { Category, Dataset, Locale, Province } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";
import DatasetCard from "@/components/dataset-card";

type Props = {
  datasets: Dataset[];
  categories: Category[];
  provinces: Province[];
  locale: Locale;
  t: Dictionary;
  initialCategory?: string;
};

export default function CatalogBrowser({ datasets, categories, provinces, locale, t, initialCategory }: Props) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(initialCategory && categories.some((c) => c.id === initialCategory) ? initialCategory : "");
  const [province, setProvince] = useState("");
  const [geometry, setGeometry] = useState("");
  const [source, setSource] = useState("all");
  const [sort, setSort] = useState<"title" | "updated" | "features">("title");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = datasets.filter((d) => {
      if (category && d.category !== category) return false;
      if (province && !d.provinces.includes(province)) return false;
      if (geometry && d.geometryType !== geometry) return false;
      if (source === "sample" && !d.isDemo) return false;
      if (source === "public" && d.isDemo) return false;
      if (needle) {
        const hay = [d.title.en, d.title.fil, d.summary.en, d.summary.fil, d.publisher, d.steward, ...d.tags]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sort === "updated") return b.lastUpdated.localeCompare(a.lastUpdated);
      if (sort === "features") return (b.featureCount ?? 0) - (a.featureCount ?? 0);
      return a.title[locale].localeCompare(b.title[locale]);
    });
  }, [datasets, q, category, province, geometry, source, sort, locale]);

  const hasFilters = Boolean(q || category || province || geometry || source !== "all");

  function clearAll() {
    setQ("");
    setCategory("");
    setProvince("");
    setGeometry("");
    setSource("all");
    setSort("title");
  }

  const selectClass =
    "w-full appearance-none rounded-[9px] border border-sand-300 bg-white py-2 pl-3 pr-8 text-[13px] font-medium text-forest-900 transition hover:border-forest-300 focus:border-forest-600 focus:outline-none focus:ring-4 focus:ring-forest-100";

  return (
    <div>
      <div className="overflow-hidden rounded-card border border-sand-200 bg-white/75 shadow-card">
        <div className="grid gap-x-4 gap-y-4 p-4 sm:p-5 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <label htmlFor="catalog-search" className="field-label">
              {t.catalog.search_placeholder.replace(/…|\.\.\.$/, "")}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-forest-500">
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="9" cy="9" r="6" />
                  <path d="m13.5 13.5 3.5 3.5" strokeLinecap="round" />
                </svg>
              </span>
              <input
                id="catalog-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.catalog.search_placeholder}
                className="w-full rounded-[9px] border border-sand-300 bg-white py-2 pl-9 pr-3 text-[13px] text-ink transition placeholder:text-forest-500/50 hover:border-forest-300 focus:border-forest-600 focus:outline-none focus:ring-4 focus:ring-forest-100"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="filter-category" className="field-label">
              {t.catalog.filter_category}
            </label>
            <div className="relative">
              <select id="filter-category" value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
                <option value="">{t.common.all}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {locale === "fil" ? c.fil : c.en}
                  </option>
                ))}
              </select>
              <Chevron />
            </div>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="filter-province" className="field-label">
              {t.catalog.filter_province}
            </label>
            <div className="relative">
              <select id="filter-province" value={province} onChange={(e) => setProvince(e.target.value)} className={selectClass}>
                <option value="">{t.common.all}</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {locale === "fil" ? p.fil : p.en}
                  </option>
                ))}
              </select>
              <Chevron />
            </div>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="filter-geometry" className="field-label">
              {t.catalog.filter_geometry}
            </label>
            <div className="relative">
              <select id="filter-geometry" value={geometry} onChange={(e) => setGeometry(e.target.value)} className={selectClass}>
                <option value="">{t.common.all}</option>
                <option value="polygon">{t.common.polygon}</option>
                <option value="polyline">{t.common.polyline}</option>
                <option value="point">{t.common.point}</option>
              </select>
              <Chevron />
            </div>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="filter-source" className="field-label">
              {t.catalog.filter_source}
            </label>
            <div className="relative">
              <select id="filter-source" value={source} onChange={(e) => setSource(e.target.value)} className={selectClass}>
                <option value="all">{t.catalog.source_all}</option>
                <option value="sample">{t.catalog.source_sample}</option>
                <option value="public">{t.catalog.source_public}</option>
              </select>
              <Chevron />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-sand-200 bg-sand-50/70 px-4 py-3 sm:px-5">
          <p className="flex items-baseline gap-1.5 text-[12px] text-forest-700">
            <span className="font-display text-[17px] font-semibold tabular-nums text-forest-950">{filtered.length}</span>
            {filtered.length === 1 ? t.catalog.results_one : t.catalog.results_many}
            <span className="text-forest-500">/ {datasets.length}</span>
          </p>

          <div className="ml-auto flex items-center gap-3">
            <label htmlFor="catalog-sort" className="text-[10px] font-semibold uppercase tracking-[0.12em] text-forest-600">
              {t.catalog.sort}
            </label>
            <select
              id="catalog-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="rounded-[7px] border border-sand-300 bg-white px-2 py-1.5 text-[11px] font-medium text-forest-900 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-100"
            >
              <option value="title">{t.catalog.sort_title}</option>
              <option value="updated">{t.catalog.sort_updated}</option>
              <option value="features">{t.catalog.sort_features}</option>
            </select>

            {hasFilters ? (
              <button
                type="button"
                onClick={clearAll}
                className="text-[11px] font-semibold uppercase tracking-[0.1em] text-forest-700 underline-offset-4 transition hover:text-forest-950 hover:underline"
              >
                {t.catalog.clear}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {filtered.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <DatasetCard key={d.slug} dataset={d} locale={locale} t={t} />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid place-items-center rounded-card border border-dashed border-sand-300 bg-white/50 px-6 py-20 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-full border border-sand-300 text-forest-500">
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="9" cy="9" r="6" />
              <path d="m13.5 13.5 3.5 3.5" strokeLinecap="round" />
            </svg>
          </span>
          <p className="mt-4 font-display text-[17px] font-semibold text-forest-950">{t.catalog.empty_title}</p>
          <p className="mt-1.5 max-w-sm text-[13px] leading-6 text-forest-700">{t.catalog.empty_body}</p>
          {hasFilters ? (
            <button type="button" onClick={clearAll} className="btn-secondary btn-sm mt-5">
              {t.catalog.clear}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function Chevron() {
  return (
    <span aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-forest-500">
      <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="m2.5 4.5 3.5 3.5 3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

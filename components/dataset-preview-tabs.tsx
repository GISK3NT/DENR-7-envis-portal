"use client";

import { useState } from "react";
import PreviewMap from "@/components/preview-map";
import { categoryColor } from "@/lib/style";
import type { Dataset, Locale } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";
import { pick } from "@/lib/i18n";

type Props = {
  dataset: Dataset;
  locale: Locale;
  t: Dictionary;
};

export default function DatasetPreviewTabs({ dataset, locale, t }: Props) {
  const [tab, setTab] = useState<"map" | "image">("map");
  if (!dataset.preview) return null;

  const title = pick(dataset.title, locale);
  const color = categoryColor[dataset.category] ?? "#276b44";
  const thumb = dataset.preview.thumb;

  return (
    <section>
      <div className="flex items-center gap-2 border-b border-sand-300">
        <button
          type="button"
          onClick={() => setTab("map")}
          className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
            tab === "map"
              ? "border-forest-700 text-forest-950"
              : "border-transparent text-forest-600 hover:text-forest-900"
          }`}
          aria-selected={tab === "map"}
          role="tab"
        >
          {locale === "fil" ? "Interactive na mapa" : "Interactive map"}
        </button>
        {thumb ? (
          <button
            type="button"
            onClick={() => setTab("image")}
            className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
              tab === "image"
                ? "border-forest-700 text-forest-950"
                : "border-transparent text-forest-600 hover:text-forest-900"
            }`}
            aria-selected={tab === "image"}
            role="tab"
          >
            {locale === "fil" ? "Larawan (thumbnail)" : "Thumbnail image"}
          </button>
        ) : null}
      </div>

      <div className="mt-4">
        {tab === "map" ? (
          <figure>
            <PreviewMap
              src={dataset.preview.file}
              geometry={dataset.geometryType}
              color={color}
              heightClassName="h-[460px] sm:h-[540px] lg:h-[600px]"
              label={title}
              locale={locale}
              fields={dataset.fields}
              watermark={dataset.isDemo ? t.dataset.sample_badge : t.dataset.public_badge}
            />
            <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-forest-600">
              <span>{t.dataset.preview_note}</span>
              <span className="hidden sm:inline">{t.dataset.map_hint}</span>
            </figcaption>
          </figure>
        ) : (
          <figure className="overflow-hidden rounded-card border border-sand-200 bg-[#e7efe4]">
            <div className="flex items-center justify-center p-3">
              <img
                src={thumb}
                alt={`${title} thumbnail preview`}
                className="h-auto w-full max-w-[800px] rounded-[8px] border border-sand-200 bg-white/40"
                style={{ aspectRatio: "400 / 260", objectFit: "contain" }}
              />
            </div>
            <figcaption className="border-t border-sand-200 bg-white/70 px-4 py-2 text-xs text-forest-700">
              {locale === "fil"
                ? "Static na thumbnail na may Esri World Topo basemap at natatanging kulay ng dataset."
                : "Static thumbnail with Esri World Topo basemap and unique dataset color."}
              <span className="ml-2 text-forest-500">(Esri, HERE, Garmin, USGS, © OpenStreetMap contributors)</span>
            </figcaption>
          </figure>
        )}
      </div>
    </section>
  );
}

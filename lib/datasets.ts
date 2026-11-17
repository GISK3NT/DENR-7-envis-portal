import rawDatasets from "@/data/datasets.json";
import rawTaxonomy from "@/data/taxonomy.json";
import type { Category, CategoryId, Dataset, Province } from "@/lib/types";

const datasets = rawDatasets as unknown as Dataset[];
const taxonomy = rawTaxonomy as {
  categories: Category[];
  provinces: Province[];
  region: { code: string; en: string; fil: string };
};

export const region = taxonomy.region;

export function getCategories(): Category[] {
  return taxonomy.categories;
}

export function getCategory(id: string): Category | undefined {
  return taxonomy.categories.find((c) => c.id === id);
}

export function getProvinces(): Province[] {
  return taxonomy.provinces;
}

export function getProvince(id: string): Province | undefined {
  return taxonomy.provinces.find((p) => p.id === id);
}

export function getDatasets(): Dataset[] {
  return [...datasets].sort((a, b) => a.slug.localeCompare(b.slug));
}

export function getDataset(slug: string): Dataset | undefined {
  return datasets.find((d) => d.slug === slug);
}

const FEATURED_SLUGS = ["landcover-2025-r7", "protected-areas-r7", "watersheds-r7", "tenurial-cbfma-r7"];

export function getFeatured(limit = 3): Dataset[] {
  const preferred = FEATURED_SLUGS.map((slug) => datasets.find((d) => d.slug === slug)).filter(
    (d): d is Dataset => Boolean(d),
  );
  const rest = getDatasets().filter((d) => !FEATURED_SLUGS.includes(d.slug) && d.preview);
  return [...preferred, ...rest].slice(0, limit);
}

export function countByCategory(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of datasets) out[d.category] = (out[d.category] ?? 0) + 1;
  return out;
}

export function relatedDatasets(dataset: Dataset, limit = 3): Dataset[] {
  return datasets
    .filter((d) => d.slug !== dataset.slug && d.category === dataset.category)
    .slice(0, limit);
}

export type CatalogFilters = {
  q?: string;
  category?: string;
  province?: string;
  geometry?: string;
  demo?: "all" | "sample" | "public";
};

export function filterDatasets(filters: CatalogFilters): Dataset[] {
  const q = filters.q?.trim().toLowerCase() ?? "";
  return getDatasets().filter((d) => {
    if (filters.category && d.category !== (filters.category as CategoryId)) return false;
    if (filters.province && !d.provinces.includes(filters.province)) return false;
    if (filters.geometry && d.geometryType !== filters.geometry) return false;
    if (filters.demo === "sample" && !d.isDemo) return false;
    if (filters.demo === "public" && d.isDemo) return false;
    if (q) {
      const haystack = [
        d.title.en,
        d.title.fil,
        d.summary.en,
        d.summary.fil,
        d.publisher,
        d.steward,
        ...d.tags,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

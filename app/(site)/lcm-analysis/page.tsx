import { getDataset } from "@/lib/datasets";
import { LCM_STATS, LCM_LEGEND, harmonizedTotals, normalizeClassKey, yearTotal } from "@/lib/lcm-analysis";
import LcmAnalysisView from "@/components/lcm-analysis-view";

export const metadata = {
  title: "Land Cover (LCM) Analysis · ENVIS",
  description: "Land cover/land use change detection analysis for Region VII (2003, 2010, 2015, 2020, 2025) with maps, charts, tables, and statistics.",
};

export default function LcmAnalysisPage() {
  const years = LCM_STATS.map((y) => ({
    ...y,
    dataset: getDataset(y.datasetSlug) ?? null,
  }));
  const harmonized = harmonizedTotals();
  const totals = Object.fromEntries(LCM_STATS.map((y) => [y.year, yearTotal(y)])) as Record<number, number>;

  return (
    <div className="container-gov py-10">
      <div className="max-w-4xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-600">Land Cover &amp; Land Use</p>
        <h1 className="mt-3 font-display text-[clamp(1.9rem,3.6vw,2.8rem)] font-semibold leading-[1.05] tracking-tightest text-forest-950">
          LCM Land Cover Analysis &amp; Change Detection
        </h1>
        <p className="mt-4 max-w-[75ch] text-[14.5px] leading-7 text-forest-800/85">
          Analysis of Region VII land cover / land use across five epochs (2003, 2010, 2015, 2020, 2025) based on official
          DENR/NAMRIA land cover mapping products. Includes per-year maps, class-area statistics, change detection, and major changes.
        </p>
        <p className="mt-2 text-xs text-forest-600">
          Statistics are derived from the official Region VII land/forest cover layers (class and area/hectare attributes) used in this portal.
          Classification schemes and mapped extent differ by epoch; changes are interpreted in that context.
        </p>
      </div>

      <div className="mt-8">
        <LcmAnalysisView years={years} harmonized={harmonized} totals={totals} legend={LCM_LEGEND} />
      </div>
    </div>
  );
}

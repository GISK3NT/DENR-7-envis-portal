"use client";

import { useMemo, useState } from "react";
import PreviewMap from "@/components/preview-map";
import type { Dataset } from "@/lib/types";
import type { YearStats } from "@/lib/lcm-analysis";
import { classColor, yearTotal } from "@/lib/lcm-analysis";

type YearWithDataset = YearStats & { dataset: Dataset | null };
type HarmonizedRow = { key: string; label: string; color: string; values: Record<number, number> };

function fmt(n: number, digits = 2) {
  return n.toLocaleString("en-PH", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function fmt0(n: number) {
  return n.toLocaleString("en-PH", { maximumFractionDigits: 0 });
}

function pct(part: number, total: number) {
  if (!total) return 0;
  return (part / total) * 100;
}

export default function LcmAnalysisView({
  years,
  harmonized,
  totals,
  legend,
}: {
  years: YearWithDataset[];
  harmonized: HarmonizedRow[];
  totals: Record<number, number>;
  legend: { key: string; label: string; color: string }[];
}) {
  const [tab, setTab] = useState<"overview" | "maps" | "stats" | "change">("overview");
  const yearNums = years.map((y) => y.year);

  const periods = useMemo(() => {
    const pairs: [number, number][] = [];
    for (let i = 0; i < yearNums.length - 1; i++) pairs.push([yearNums[i], yearNums[i + 1]]);
    pairs.push([yearNums[0], yearNums[yearNums.length - 1]]);
    return pairs;
  }, [yearNums]);

  function changeRows(from: number, to: number) {
    const rows = harmonized
      .map((r) => {
        const a = r.values[from] || 0;
        const b = r.values[to] || 0;
        const diff = b - a;
        const pctChange = a ? (diff / a) * 100 : b ? 100 : 0;
        return { ...r, a, b, diff, pctChange };
      })
      .filter((r) => r.a !== 0 || r.b !== 0);
    rows.sort((x, y) => y.diff - x.diff);
    return rows;
  }

  const majorOverall = useMemo(() => {
    const rows = changeRows(yearNums[0], yearNums[yearNums.length - 1]);
    const gains = [...rows].filter((r) => r.diff > 0).sort((a, b) => b.diff - a.diff).slice(0, 5);
    const losses = [...rows].filter((r) => r.diff < 0).sort((a, b) => a.diff - b.diff).slice(0, 5);
    return { gains, losses, rows };
  }, [harmonized, yearNums]);

  const maxH = useMemo(() => {
    let m = 0;
    for (const r of harmonized) for (const y of yearNums) m = Math.max(m, r.values[y] || 0);
    return m || 1;
  }, [harmonized, yearNums]);

  const tabs: { id: typeof tab; label: string }[] = [
    { id: "overview", label: "Overview & Chart" },
    { id: "maps", label: "Maps by Year" },
    { id: "stats", label: "Statistics Table" },
    { id: "change", label: "Change Detection" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-sand-300">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            type="button"
            onClick={() => setTab(tb.id)}
            className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
              tab === tb.id ? "border-forest-700 text-forest-950" : "border-transparent text-forest-600 hover:text-forest-900"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="font-display text-xl font-semibold text-forest-950">Legend (harmonized classes)</h2>
            <p className="mt-1 text-xs text-forest-600">Colors used consistently for charts, tables, and interpretation across years (NAMRIA-style LCM categories).</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {harmonized.map((l) => (
                <span key={l.key} className="inline-flex items-center gap-2 rounded-full border border-sand-200 bg-white px-2.5 py-1 text-xs text-forest-800">
                  <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="font-display text-xl font-semibold text-forest-950">Land cover area by class and year (ha)</h2>
            <p className="mt-1 text-xs text-forest-600">Grouped bars show area (hectares) per harmonized class for 2003, 2010, 2015, 2020, 2025. Based on official layer attributes.</p>
            <div className="mt-4 overflow-x-auto">
              <div className="min-w-[900px] space-y-3">
                {harmonized.filter(r=>yearNums.some(y=>r.values[y]>0)).map((r) => (
                  <div key={r.key} className="grid grid-cols-[180px_1fr] items-center gap-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-forest-900">
                      <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: r.color }} />
                      <span className="truncate" title={r.label}>{r.label}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {yearNums.map((y) => {
                        const v = r.values[y] || 0;
                        const w = (v / maxH) * 100;
                        return (
                          <div key={y} className="flex items-center gap-2">
                            <div className="h-5 flex-1 rounded bg-sand-100 overflow-hidden">
                              <div className="h-full rounded" style={{ width: `${Math.max(v ? 1.5 : 0, w)}%`, backgroundColor: r.color }} title={`${r.label} ${y}: ${fmt(v)} ha`} />
                            </div>
                            <span className="w-[62px] text-right text-[10px] tabular-nums text-forest-700">{v ? fmt0(v) : "—"}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-[180px_1fr] items-center gap-3 pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-forest-600">
                  <div />
                  <div className="grid grid-cols-5 gap-2">{yearNums.map((y)=><div key={y} className="text-center">{y}</div>)}</div>
                </div>
              </div>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="font-display text-xl font-semibold text-forest-950">Major changes (2003 → 2025, harmonized)</h2>
            <p className="mt-1 text-xs text-forest-600">Largest net gains and losses by area (ha) between the earliest (2003) and latest (2025) epochs. Positive = increase, negative = decrease. Interpretation should consider differing class schemes/extents per epoch.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-forest-900">Largest net gains</h3>
                <ul className="mt-2 space-y-2">
                  {majorOverall.gains.map((r) => (
                    <li key={r.key} className="flex items-center justify-between gap-3 rounded-[8px] border border-sand-200 bg-white px-3 py-2 text-sm">
                      <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{backgroundColor:r.color}} />{r.label}</span>
                      <span className="font-semibold tabular-nums text-forest-800">+{fmt(r.diff)} ha</span>
                    </li>
                  ))}
                  {!majorOverall.gains.length && <li className="text-sm text-forest-600">None</li>}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-forest-900">Largest net losses</h3>
                <ul className="mt-2 space-y-2">
                  {majorOverall.losses.map((r) => (
                    <li key={r.key} className="flex items-center justify-between gap-3 rounded-[8px] border border-sand-200 bg-white px-3 py-2 text-sm">
                      <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{backgroundColor:r.color}} />{r.label}</span>
                      <span className="font-semibold tabular-nums text-red-700">{fmt(r.diff)} ha</span>
                    </li>
                  ))}
                  {!majorOverall.losses.length && <li className="text-sm text-forest-600">None</li>}
                </ul>
              </div>
            </div>
            <div className="mt-4 rounded-[10px] border border-brass-200 bg-brass-50 px-4 py-3 text-xs leading-6 text-brass-800">
              <strong>Note:</strong> 2003 uses a forest/land cover classification (e.g. separate broadleaved/mixed and wooded grassland classes) and different mapped totals than later LCM epochs; 2010 includes Fallow/Wooded Grassland/Shrubs distinctions; 2015–2025 follow more comparable LCM class groupings. Reported totals vary by epoch extent/method, so change values reflect the underlying official datasets and should be read with these scheme differences in mind.
            </div>
          </section>
        </div>
      ) : null}

      {tab === "maps" ? (
        <div className="space-y-6">
          <p className="text-sm text-forest-700">
            Land cover maps for each year (simplified interactive previews from official Region VII layers), colored by land-cover class
            using the uniform legend.
          </p>
          <div className="grid gap-6 xl:grid-cols-2">
            {years.map((y) => {
              const colorMap = Object.fromEntries(y.classes.map((c) => [c.class, classColor(c.class)]));
              const displaySrc = `/previews/lcm-display/${y.datasetSlug}.geojson`;
              return (
                <section key={y.year} className="card overflow-hidden">
                  <div className="flex items-center justify-between gap-3 border-b border-sand-200 px-4 py-3">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-forest-950">{y.year} — {y.datasetTitle}</h3>
                      <p className="text-xs text-forest-600">
                        Total (reported): {fmt(yearTotal(y))} ha · {y.classes.length} classes
                      </p>
                    </div>
                  </div>
                  <div className="p-3">
                    {y.dataset?.preview ? (
                      <PreviewMap
                        src={displaySrc}
                        geometry={y.dataset.geometryType}
                        color="#5b8a3c"
                        height={360}
                        label={`${y.label} land cover map`}
                        fields={y.dataset.fields}
                        colorProperty={y.classField}
                        colorMap={colorMap}
                      />
                    ) : (
                      <div className="grid h-[320px] place-items-center rounded border border-sand-200 bg-sand-50 text-sm text-forest-600">
                        Preview unavailable
                      </div>
                    )}
                  </div>
                  <div className="border-t border-sand-200 px-4 py-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-forest-600">
                      Classes (layer) — uniform legend colors
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {y.classes.map((c) => (
                        <span
                          key={c.class}
                          className="inline-flex items-center gap-1.5 rounded-full border border-sand-200 bg-white px-2 py-0.5 text-[11px] text-forest-800"
                        >
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: classColor(c.class) }} />
                          {c.class}
                        </span>
                      ))}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : null}

      {tab === "stats" ? (
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="font-display text-xl font-semibold text-forest-950">Per-year class area statistics (ha, % of year total)</h2>
            <p className="mt-1 text-xs text-forest-600">Values from official land/forest cover layer attributes for Region VII. % is relative to the reported total for that year.</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-sand-100/80 text-left text-[10px] uppercase tracking-[0.12em] text-forest-700">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">Harmonized class</th>
                    {yearNums.map((y) => (
                      <th key={y} className="px-3 py-2.5 font-semibold text-right">{y} (ha)</th>
                    ))}
                    {yearNums.map((y) => (
                      <th key={`p${y}`} className="px-3 py-2.5 font-semibold text-right">{y} (%)</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {harmonized.map((r) => (
                    <tr key={r.key} className="border-t border-forest-50">
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{backgroundColor:r.color}} />{r.label}</span>
                      </td>
                      {yearNums.map((y) => <td key={y} className="px-3 py-2.5 text-right tabular-nums">{r.values[y] ? fmt(r.values[y]) : "—"}</td>)}
                      {yearNums.map((y) => <td key={`p${y}`} className="px-3 py-2.5 text-right tabular-nums text-forest-700">{r.values[y] ? fmt(pct(r.values[y], totals[y])) + "%" : "—"}</td>)}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-sand-300 bg-sand-50 font-semibold">
                    <td className="px-3 py-2.5">Reported total</td>
                    {yearNums.map((y) => <td key={y} className="px-3 py-2.5 text-right tabular-nums">{fmt(totals[y])}</td>)}
                    {yearNums.map((y) => <td key={`p${y}`} className="px-3 py-2.5 text-right tabular-nums">100.00%</td>)}
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="font-display text-xl font-semibold text-forest-950">Original class breakdown by year</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {years.map((y) => {
                const total = yearTotal(y);
                return (
                  <div key={y.year} className="overflow-hidden rounded-[10px] border border-sand-200">
                    <div className="bg-sand-50 px-4 py-2.5">
                      <h3 className="font-semibold text-forest-950">{y.year} <span className="font-normal text-forest-600">({y.classField} / {y.areaField})</span></h3>
                      <p className="text-xs text-forest-600">Total: {fmt(total)} ha</p>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="text-left text-[10px] uppercase tracking-[0.1em] text-forest-600">
                        <tr><th className="px-4 py-2">Class (original)</th><th className="px-4 py-2 text-right">ha</th><th className="px-4 py-2 text-right">%</th></tr>
                      </thead>
                      <tbody>
                        {[...y.classes].sort((a,b)=>b.ha-a.ha).map((c) => (
                          <tr key={c.class} className="border-t border-sand-100">
                            <td className="px-4 py-2"><span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{backgroundColor: classColor(c.class)}} />{c.class}</span></td>
                            <td className="px-4 py-2 text-right tabular-nums">{fmt(c.ha)}</td>
                            <td className="px-4 py-2 text-right tabular-nums text-forest-700">{fmt(pct(c.ha,total))}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}

      {tab === "change" ? (
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="font-display text-xl font-semibold text-forest-950">Change detection by period (harmonized classes)</h2>
            <p className="mt-1 text-xs text-forest-600">Net change = (later − earlier) in hectares. % change relative to the earlier period (blank/∞-like cases handled as new/lost). Periods: 2003–2010, 2010–2015, 2015–2020, 2020–2025, and overall 2003–2025.</p>
            <div className="mt-4 space-y-6">
              {([[2003,2010],[2010,2015],[2015,2020],[2020,2025],[2003,2025]] as [number,number][]).map(([from,to]) => {
                const rows = changeRows(from,to);
                const totalA = totals[from] || 0, totalB = totals[to] || 0;
                return (
                  <div key={`${from}-${to}`} className="overflow-hidden rounded-[10px] border border-sand-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-sand-50 px-4 py-3">
                      <h3 className="font-display text-lg font-semibold text-forest-950">{from} → {to} {from===2003&&to===2025 ? "(overall)" : ""}</h3>
                      <p className="text-xs text-forest-700">Reported total: {fmt(totalA)} ha → {fmt(totalB)} ha (Δ {fmt(totalB-totalA)} ha)</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-left text-[10px] uppercase tracking-[0.1em] text-forest-600 bg-white">
                          <tr>
                            <th className="px-4 py-2">Class</th>
                            <th className="px-4 py-2 text-right">{from} (ha)</th>
                            <th className="px-4 py-2 text-right">{to} (ha)</th>
                            <th className="px-4 py-2 text-right">Change (ha)</th>
                            <th className="px-4 py-2 text-right">Change (%)</th>
                            <th className="px-4 py-2">Trend</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r) => (
                            <tr key={r.key} className="border-t border-sand-100">
                              <td className="px-4 py-2"><span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{backgroundColor:r.color}} />{r.label}</span></td>
                              <td className="px-4 py-2 text-right tabular-nums">{r.a?fmt(r.a):"—"}</td>
                              <td className="px-4 py-2 text-right tabular-nums">{r.b?fmt(r.b):"—"}</td>
                              <td className={`px-4 py-2 text-right tabular-nums font-medium ${r.diff>0?"text-forest-800":r.diff<0?"text-red-700":"text-forest-600"}`}>{r.diff>0?"+":""}{fmt(r.diff)}</td>
                              <td className={`px-4 py-2 text-right tabular-nums ${r.diff>0?"text-forest-800":r.diff<0?"text-red-700":"text-forest-600"}`}>{r.a? (r.pctChange>0?"+":"")+fmt(r.pctChange)+"%": (r.b?"new":"—")}</td>
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-24 overflow-hidden rounded bg-sand-100">
                                    <div className={`h-full ${r.diff>=0?"bg-forest-500":"bg-red-500"}`} style={{width:`${Math.min(100, Math.abs(r.pctChange))}%`}} />
                                  </div>
                                  <span className="text-[11px] text-forest-600">{r.diff>0?"gain":r.diff<0?"loss":"no change"}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

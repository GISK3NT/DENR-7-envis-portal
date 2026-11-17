"use client";

import { useEffect, useMemo, useState } from "react";

type FileInfo = { name: string; type: "HS" | "CTOUR" | "OTHER"; size: number };
type ProvinceInfo = { province: string; files: FileInfo[] };

function formatMB(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function prettyName(name: string) {
  return name
    .replace(/\.jpe?g$/i, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function GeohazardMapsBrowser() {
  const [data, setData] = useState<ProvinceInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [province, setProvince] = useState<string>("");
  const [type, setType] = useState<"ALL" | "HS" | "CTOUR">("ALL");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/geohazards-jpeg")
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        if (j.error) throw new Error(j.error);
        setData(j.provinces || []);
      })
      .catch((e) => alive && setError(e.message || "Failed to load"));
    return () => {
      alive = false;
    };
  }, []);

  const provinces = data ?? [];
  useEffect(() => {
    if (!province && provinces.length) setProvince(provinces[0].province);
  }, [province, provinces]);

  const current = provinces.find((p) => p.province === province);
  const files = useMemo(() => {
    const list = (current?.files ?? []).filter((f) => (type === "ALL" ? true : f.type === type));
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((f) => f.name.toLowerCase().includes(needle) || prettyName(f.name).toLowerCase().includes(needle));
  }, [current, type, q]);

  useEffect(() => {
    setSelected(null);
  }, [province, type, q]);

  if (error) return <div className="rounded-card border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>;
  if (!data) return <div className="card p-6 text-sm text-forest-700">Loading geohazard map index…</div>;

  const selectedUrl = selected && province ? `/api/geohazards-jpeg?path=${encodeURIComponent(`${province}/${selected}`)}` : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="card overflow-hidden">
        <div className="space-y-3 border-b border-sand-200 p-4">
          <div>
            <label className="field-label">Province</label>
            <select value={province} onChange={(e) => setProvince(e.target.value)} className="w-full rounded-[9px] border border-sand-300 bg-white px-3 py-2 text-sm">
              {provinces.map((p) => (
                <option key={p.province} value={p.province}>
                  {p.province} ({p.files.length})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="field-label">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full rounded-[9px] border border-sand-300 bg-white px-3 py-2 text-sm">
                <option value="ALL">All</option>
                <option value="HS">Susceptibility (HS)</option>
                <option value="CTOUR">Contour (CTOUR)</option>
              </select>
            </div>
            <div>
              <label className="field-label">Search</label>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Municipality…" className="w-full rounded-[9px] border border-sand-300 bg-white px-3 py-2 text-sm" />
            </div>
          </div>
          <p className="text-xs text-forest-600">{files.length} map sheet(s)</p>
        </div>
        <ul className="max-h-[70vh] overflow-auto p-2">
          {files.map((f) => {
            const active = selected === f.name;
            return (
              <li key={f.name}>
                <button
                  type="button"
                  onClick={() => setSelected(f.name)}
                  className={`w-full rounded-[8px] px-3 py-2 text-left transition ${active ? "bg-forest-100 text-forest-950" : "hover:bg-sand-100"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-forest-900">{prettyName(f.name)}</span>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${f.type === "HS" ? "bg-amber-100 text-amber-800" : f.type === "CTOUR" ? "bg-sky-100 text-sky-800" : "bg-sand-200 text-forest-700"}`}>
                      {f.type}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-forest-600">{f.name} · {formatMB(f.size)}</div>
                </button>
              </li>
            );
          })}
          {!files.length ? <li className="p-3 text-sm text-forest-600">No maps match.</li> : null}
        </ul>
      </div>

      <div className="card min-h-[420px] overflow-hidden">
        {selectedUrl ? (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-sand-200 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-forest-950">{selected ? prettyName(selected) : ""}</p>
                <p className="text-xs text-forest-600">{province} · MGB Geohazard Map (JPEG)</p>
              </div>
              <a href={selectedUrl} target="_blank" rel="noreferrer" className="btn-secondary btn-sm shrink-0">
                Open map
              </a>
            </div>
            <div className="flex-1 overflow-auto bg-sand-100 p-3">
              <img
                src={selectedUrl}
                alt={selected ? prettyName(selected) : "Geohazard map"}
                className="mx-auto h-auto max-w-full rounded border border-sand-200 bg-white shadow-sm"
              />
            </div>
          </div>
        ) : (
          <div className="grid h-full min-h-[420px] place-items-center p-8 text-center text-sm text-forest-600">
            Select a map sheet to view the geohazard (HS) or contour (CTOUR) JPEG.
          </div>
        )}
      </div>
    </div>
  );
}

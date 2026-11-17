export type LcmYear = 2003 | 2010 | 2015 | 2020 | 2025;

export type ClassStat = { class: string; ha: number };

export type YearStats = {
  year: LcmYear;
  label: string;
  datasetSlug: string;
  datasetTitle: string;
  sourceNote: string;
  classField: string;
  areaField: string;
  classes: ClassStat[];
};

// Statistics derived from DENR Region VII land/forest cover preview layers (official source shapefiles),
// dissolved by land-cover class with area (hectares) as provided in the layer attributes.
export const LCM_STATS: YearStats[] = [
  {
    year: 2003,
    label: "2003",
    datasetSlug: "forest-cover-2003-r7",
    datasetTitle: "Forest / Land Cover 2003 – Region VII",
    sourceNote: "2003 official forest/land cover (Region VII subset), class: 2003LCOVER, area: HECTARE.",
    classField: "2003LCOVER",
    areaField: "HECTARE",
    classes: [
      { class: "Closed forest, broadleaved", ha: 2231.7785993138 },
      { class: "Forest plantation, broadleaved", ha: 17842.389082702924 },
      { class: "Inland water", ha: 1243.98626923539 },
      { class: "Mangrove forest", ha: 11769.630438901744 },
      { class: "Open forest, broadleaved", ha: 39672.22615038092 },
      { class: "Open forest, mixed", ha: 3352.342793975 },
      { class: "Other land, built-up area", ha: 14006.916801435898 },
      { class: "Other land, cultivated, annual crop", ha: 380609.95950068533 },
      { class: "Other land, cultivated, perennial crop", ha: 168411.39185197622 },
      { class: "Other land, fishpond", ha: 9040.888113352119 },
      { class: "Other land, natural, barren land", ha: 2428.7471503307 },
      { class: "Other land, natural, grassland", ha: 346639.71810182265 },
      { class: "Other wooded land, shrubs", ha: 203381.47302046415 },
      { class: "Other wooded land, wooded grassland", ha: 216219.21250974614 },
    ],
  },
  {
    year: 2010,
    label: "2010",
    datasetSlug: "landcover-2010-r7",
    datasetTitle: "Land Cover 2010 – Region VII",
    sourceNote: "2010 land cover (Region VII), class: AGG14, area: HECTARE.",
    classField: "AGG14",
    areaField: "HECTARE",
    classes: [
      { class: "Closed Forest", ha: 11463.524261231996 },
      { class: "Open Forest", ha: 35797.662581977835 },
      { class: "Mangrove Forest", ha: 14772.229505581958 },
      { class: "Shrubs", ha: 272174.09958985145 },
      { class: "Fallow", ha: 544.73140596544 },
      { class: "Wooded Grassland", ha: 205685.89010442607 },
      { class: "Open/Barren", ha: 2172.847565233498 },
      { class: "Grassland", ha: 54326.322909476236 },
      { class: "Marshland/Swamp", ha: 172.3516695591 },
      { class: "Annual Crop", ha: 364827.60725526616 },
      { class: "Perennial Crop", ha: 398788.4273614742 },
      { class: "Fishpond", ha: 10127.509920565733 },
      { class: "Built-up", ha: 41768.81667271883 },
      { class: "Inland Water", ha: 5623.825010014827 },
    ],
  },
  {
    year: 2015,
    label: "2015",
    datasetSlug: "landcover-2015-r7",
    datasetTitle: "Land Cover 2015 – Region VII",
    sourceNote: "2015 land cover (Region VII), class: AGG12, area: HECTARE.",
    classField: "AGG12",
    areaField: "HECTARE",
    classes: [
      { class: "Annual Crop", ha: 671003.990715015 },
      { class: "Brush/Shrubs", ha: 777868.133695546 },
      { class: "Open/Barren", ha: 2758.6458636162183 },
      { class: "Built-up", ha: 56086.50338238257 },
      { class: "Fishpond", ha: 9144.045328641612 },
      { class: "Grassland", ha: 75096.24328719145 },
      { class: "Inland Water", ha: 7692.961589595126 },
      { class: "Mangrove Forest", ha: 16408.63019523111 },
      { class: "Open Forest", ha: 56211.605111416546 },
      { class: "Perennial Crop", ha: 435024.6658320945 },
      { class: "Closed Forest", ha: 4226.422320316299 },
      { class: "Marshland/Swamp", ha: 59.5348325979151 },
    ],
  },
  {
    year: 2020,
    label: "2020",
    datasetSlug: "landcover-2020-r7",
    datasetTitle: "Land Cover 2020 – Region VII",
    sourceNote: "2020 land cover (Region VII), class: CLASS_NAME, area: AREA_HA (dissolved by class).",
    classField: "CLASS_NAME",
    areaField: "AREA_HA",
    classes: [
      { class: "Closed Forest", ha: 7649.285342633119 },
      { class: "Fishpond", ha: 9292.615058947275 },
      { class: "Inland Water", ha: 8288.35919128425 },
      { class: "Open Forest", ha: 57548.30904405943 },
      { class: "Mangrove Forest", ha: 19333.502123723043 },
      { class: "Brush/Shrubs", ha: 408095.8426778734 },
      { class: "Perennial Crop", ha: 424271.84333127644 },
      { class: "Open/Barren", ha: 3326.265442782399 },
      { class: "Grassland", ha: 67108.42185490923 },
      { class: "Annual Crop", ha: 343143.07952718646 },
      { class: "Built-up", ha: 73407.73124392211 },
    ],
  },
  {
    year: 2025,
    label: "2025",
    datasetSlug: "landcover-2025-r7",
    datasetTitle: "Land Cover 2025 – Region VII",
    sourceNote: "2025 land cover (Region VII), class: LCM_CLASS, area: AREA_HA.",
    classField: "LCM_CLASS",
    areaField: "AREA_HA",
    classes: [
      { class: "Annual Crop", ha: 139058.44920057795 },
      { class: "Brush/Shrubs", ha: 272718.5968453772 },
      { class: "Built-up", ha: 67281.37179233543 },
      { class: "Fishpond", ha: 7192.035327956476 },
      { class: "Grassland", ha: 47163.23404488206 },
      { class: "Inland Water", ha: 5485.443551873465 },
      { class: "Mangrove Forest", ha: 18154.247419357944 },
      { class: "Open Forest", ha: 29619.669922561727 },
      { class: "Open/Barren", ha: 2579.463352675077 },
      { class: "Perennial Crop", ha: 296111.6071437879 },
      { class: "Closed Forest", ha: 232.964134386 },
    ],
  },
];

// Standardized legend (NAMRIA-style LCM categories) with display colors
export const LCM_LEGEND: { key: string; label: string; color: string }[] = [
  { key: "closed-forest", label: "Closed Forest", color: "#1f5b2e" },
  { key: "open-forest", label: "Open Forest", color: "#4f8f3a" },
  { key: "mangrove", label: "Mangrove Forest", color: "#1f8a70" },
  { key: "forest-plantation", label: "Forest Plantation", color: "#6aa84f" },
  { key: "brush-shrubs", label: "Brush/Shrubs", color: "#9aa84a" },
  { key: "grassland", label: "Grassland", color: "#d7d17a" },
  { key: "perennial-crop", label: "Perennial Crop", color: "#d9882a" },
  { key: "annual-crop", label: "Annual Crop", color: "#f2d04b" },
  { key: "built-up", label: "Built-up", color: "#c0392b" },
  { key: "open-barren", label: "Open/Barren", color: "#9b9183" },
  { key: "inland-water", label: "Inland Water", color: "#2f7ed8" },
  { key: "fishpond", label: "Fishpond", color: "#56b4d3" },
  { key: "marshland-swamp", label: "Marshland/Swamp", color: "#7b6ea8" },
  { key: "fallow", label: "Fallow", color: "#c9b46a" },
  { key: "wooded-grassland", label: "Wooded Grassland", color: "#b7c96b" },
  { key: "other", label: "Other", color: "#888888" },
];

const legendMap = Object.fromEntries(LCM_LEGEND.map((l) => [l.key, l]));

export function normalizeClassKey(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("marsh") || n.includes("swamp")) return "marshland-swamp";
  if (n.includes("mangrove")) return "mangrove";
  if (n.includes("closed forest")) return "closed-forest";
  if (n.includes("open forest")) return "open-forest";
  if (n.includes("forest plantation") || n.includes("plantation")) return "forest-plantation";
  if (n.includes("wooded grassland")) return "wooded-grassland";
  if (n.includes("brush") || n.includes("shrub") || n.includes("other wooded land, shrubs")) return "brush-shrubs";
  if (n.includes("grassland")) return "grassland";
  if (n.includes("fallow")) return "fallow";
  if (n.includes("perennial")) return "perennial-crop";
  if (n.includes("annual")) return "annual-crop";
  if (n.includes("built")) return "built-up";
  if (n.includes("fishpond")) return "fishpond";
  if (n.includes("inland water") || (n.includes("water") && !n.includes("fish"))) return "inland-water";
  if (n.includes("barren") || n.includes("open/barren")) return "open-barren";
  return "other";
}

export function classColor(name: string): string {
  return (legendMap[normalizeClassKey(name)] ?? legendMap.other).color;
}

export function classLegendLabel(name: string): string {
  return (legendMap[normalizeClassKey(name)] ?? legendMap.other).label;
}

export function yearTotal(y: YearStats): number {
  return y.classes.reduce((s, c) => s + c.ha, 0);
}

export function harmonizedTotals(): { key: string; label: string; color: string; values: Record<LcmYear, number> }[] {
  const years: LcmYear[] = [2003, 2010, 2015, 2020, 2025];
  const keys = LCM_LEGEND.map((l) => l.key);
  const out = keys.map((key) => {
    const legend = legendMap[key];
    const values = {} as Record<LcmYear, number>;
    for (const yr of years) {
      const ys = LCM_STATS.find((y) => y.year === yr)!;
      values[yr] = ys.classes
        .filter((c) => normalizeClassKey(c.class) === key)
        .reduce((s, c) => s + c.ha, 0);
    }
    return { key, label: legend.label, color: legend.color, values };
  });
  // keep only categories present in at least one year
  return out.filter((r) => years.some((yr) => r.values[yr] > 0));
}

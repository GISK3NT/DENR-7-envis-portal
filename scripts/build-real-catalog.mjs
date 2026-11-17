/**
 * build-real-catalog.mjs
 * ----------------------------------------------------------------------------
 * Builds the public ENVIS catalog from the REAL shapefiles in `shapefiles/`.
 *
 *  - Reads each source layer with mapshaper, reprojects to WGS84, and writes a
 *    LOSSY preview to public/previews/<slug>.geojson (coordinates rounded,
 *    geometry simplified, sensitive attributes dropped).
 *  - Writes data/datasets.json with real feature counts, field dictionaries,
 *    extents and provenance.
 *  - Source shapefiles are never copied into public/.
 *
 * Run:  npm run catalog
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
const ROOT = process.cwd();
const SRC = path.join(ROOT, "shapefiles");
const OUT_DIR = path.join(ROOT, "public", "previews");
const OUT_JSON = path.join(ROOT, "data", "datasets.json");
const MS = path.join(ROOT, "node_modules", "mapshaper", "bin", "mapshaper");

const TODAY = "2026-11-16";
const PRS92 =
  "+proj=tmerc +lat_0=0 +lon_0=123 +k=0.9996 +x_0=500000 +y_0=0 +ellps=clrk66 +units=m +no_defs";

const CATEGORY_LABEL = {
  "admin-boundaries": "Administrative Boundaries",
  "land-forest": "Land Classification & Forest Cover",
  water: "Watersheds & Water Resources",
  "protected-areas": "Protected Areas",
  tenure: "Tenure Instruments",
  coastal: "Coastal & Marine",
  environment: "Environmental Quality",
};

const CATEGORY_LABEL_FIL = {
  "admin-boundaries": "Hangganang Administratibo",
  "land-forest": "Klasipikasyon ng Lupa at Takip ng Kagubatan",
  water: "Watershed at Yaman ng Tubig",
  "protected-areas": "Mga Protektadong Lugar",
  tenure: "Mga Instrumento ng Tenure",
  coastal: "Baybaying at Dagat",
  environment: "Kalidad ng Kapaligiran",
};

const STEWARD = {
  "admin-boundaries": "Regional Planning and Information Unit",
  "land-forest": "Forest Management Division",
  water: "Water Resources and Watershed Management Unit",
  "protected-areas": "Protected Areas and Biodiversity Conservation Unit",
  tenure: "Land Management and Tenure Unit",
  coastal: "Coastal and Marine Ecosystems Management Unit",
  environment: "Environmental Management Bureau – Region VII",
};

/* ------------------------------------------------------------------ helpers */

function titleCase(s) {
  return s
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => (w.length > 3 && w === w.toUpperCase() ? w.charAt(0) + w.slice(1).toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

function fieldType(name) {
  const n = name.toLowerCase();
  if (/(year|yr|date|_dt$)/.test(n)) return "date";
  if (/(area|hectare|hectares|ha$|_ha|km2|sqkm|length|perimeter|elevation|elev|volume|capacity|latitude|longitude|_x|_y|pop|income|amount|dist|depth|dbh|mh)/.test(n))
    return "double";
  if (/(count|no_|num|qty|total|pop|spp|id$|code$|seq|order|hh|households)/.test(n)) return "integer";
  return "string";
}

function parseInfo(text) {
  const get = (re) => text.match(re)?.[1]?.trim() ?? null;
  const fields = [];
  let inFields = false;
  for (const line of text.split(/\r?\n/)) {
    if (/Field\s*\|\s*First value/.test(line)) {
      inFields = true;
      continue;
    }
    if (!inFields) continue;
    const m = line.match(/^\s*(\S.*?)\s*\|\s*(.*)$/);
    if (m && !/^-+$/.test(m[1])) fields.push(m[1].trim());
  }
  return {
    layerName: get(/^Layer:\s+(.+)$/m),
    geometry: get(/^Type:\s+(.+)$/m),
    records: Number((get(/^Records:\s+([\d,]+)$/m) ?? "0").replace(/,/g, "")) || 0,
    bounds: get(/^Bounds:\s+(.+)$/m)?.split(",").map(Number) ?? null,
    crs: get(/^CRS:\s+(.+)$/m),
    fields,
  };
}

async function info(file, filter) {
  const args = ["-i", file];
  if (filter) args.push("-filter", filter);
  args.push("-info");
  const { stderr } = await exec("node", [MS, ...args], { maxBuffer: 64 * 1024 * 1024 });
  return parseInfo(stderr);
}

function extentOfFeatures(features) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const walk = (c) => {
    if (typeof c[0] === "number") {
      if (c[0] < minX) minX = c[0];
      if (c[1] < minY) minY = c[1];
      if (c[0] > maxX) maxX = c[0];
      if (c[1] > maxY) maxY = c[1];
    } else c.forEach(walk);
  };
  for (const f of features) if (f.geometry) walk(f.geometry.coordinates);
  return [minX, minY, maxX, maxY];
}

function fmtExtent(e) {
  return e.map((n) => Number(n.toFixed(4)));
}

/* ------------------------------------------------------------------ registry
 * Each entry points at a real layer (or layers) under shapefiles/.
 * `preview` controls the lossy artefact; `sourceFields` whitelists attributes
 * that are safe to show on the map. Everything else is dropped.
 */
const D = (o) => o;

const CATALOG = [
  /* ---------------------------------------------------------- ADMIN BOUNDARIES */
  D({
    slug: "region-7-boundary",
    cat: "admin-boundaries",
    file: "Philippines Regional Boundary/phl_admbnda_adm1_psa_namria_20231106.shp",
    filter: "adm1_en == 'Region VII (Central Visayas)'",
    title: "Region VII Boundary",
    summary:
      "Dissolved extent of Central Visayas from the PSA/NAMRIA administrative boundary series, covering Bohol, Cebu, Negros Oriental and Siquijor.",
    tags: ["region", "boundary", "central visayas", "baseline"],
    preview: { fields: ["adm1_en"], percent: "5%", precision: 3 },
    provinces: ["bohol", "cebu", "negros-oriental", "siquijor"],
  }),
  D({
    slug: "provincial-boundaries-r7",
    cat: "admin-boundaries",
    file: "Philippines Provincial Boundries/Provincial_Boundary_of_the_Philippines_UTMLuz1911.shp",
    filter: "PROVINCE == 'BOHOL' || PROVINCE == 'CEBU' || PROVINCE == 'NEGROS ORIENTAL' || PROVINCE == 'SIQUIJOR'",
    title: "Provincial Boundaries – Region VII",
    summary:
      "Provincial boundaries for Bohol, Cebu, Negros Oriental and Siquijor, including reported land area per province.",
    tags: ["province", "boundary", "bohol", "cebu", "negros oriental", "siquijor"],
    preview: { fields: ["PROVINCE", "REGION", "HECTARES"], percent: "5%", precision: 3 },
  }),
  D({
    slug: "city-municipal-boundaries-r7",
    cat: "admin-boundaries",
    file: "PORTS OF THE PH/Political Boundaries (Barangay).shp",
    filter: "adm1_en == 'Region VII (Central Visayas)'",
    dissolve: "adm3_en,adm2_en",
    title: "City and Municipal Boundaries – Region VII",
    summary:
      "City and municipal boundaries for the four provinces, dissolved from the PSA/NAMRIA barangay boundary series.",
    tags: ["municipality", "city", "lgu", "boundary"],
    count: "preview",
    preview: { fields: ["adm3_en", "adm2_en"], percent: "3%", precision: 3 },
  }),
  D({
    slug: "barangay-boundaries-r7",
    cat: "admin-boundaries",
    file: "Region VII Barangay Boundaries/R7 BARANGAY BOUNDARIES.shp",
    filter: "adm1_en == 'Region VII (Central Visayas)'",
    title: "Barangay Boundaries – Region VII",
    summary:
      "Barangay-level administrative boundaries with city/municipal and provincial attribution for Bohol and Cebu.",
    tags: ["barangay", "boundary", "psgc"],
    preview: { fields: ["adm4_en", "adm3_en", "adm2_en"], percent: "3%", precision: 3 },
  }),
  D({
    slug: "legislative-districts-r7",
    cat: "admin-boundaries",
    file: "Region VII Districts Boundaries/R7 DISTRICTS.shp",
    title: "Legislative Districts – Region VII",
    summary: "Congressional and city legislative districts for Cebu and Bohol.",
    tags: ["district", "congressional", "legislative"],
    preview: { fields: ["NAME_2", "Province"], percent: "3%", precision: 3 },
  }),
  D({
    slug: "municipal-water-boundaries-r7",
    cat: "water",
    file: "Region VII MUNICIPAL WATER NAMRIA/REGION_VII_MUNICIPAL_WATER_NAMRIA_PRS92.shp",
    title: "Municipal Water Boundaries – Region VII",
    summary:
      "Municipal waters delineated by NAMRIA, classifying coastal substrates (beach sand, seagrass, corals, mud bottom and water).",
    tags: ["municipal water", "namria", "coastal"],
    preview: { fields: ["MUN_WATERB", "Class_name"], percent: "3%", precision: 3 },
  }),
  D({
    slug: "10k-map-index-r7",
    cat: "admin-boundaries",
    file: "10K INDEX/REGION7_10k_ORTHO_PRS92.shp",
    title: "1:10,000 Map Index – Region VII",
    summary:
      "Index grid of 1:10,000 orthophoto map sheets covering Region VII, used to reference field surveys and map products.",
    tags: ["map index", "orthophoto", "10k", "survey"],
    preview: { fields: ["MAP_NUMBER", "MAP_TITLE"], percent: "2%", precision: 3 },
  }),

  /* ------------------------------------------------------ LAND & FOREST COVER */
  D({
    slug: "landcover-2025-r7",
    cat: "land-forest",
    file: "Region VII LANDCOVER 2025/_Regional Data/Shapefiles/LCM_2025_RVII_UTMZ51N_PRS92.shp",
    dissolve: "LCM_CLASS",
    sum: "AREA_HA",
    title: "Land Cover 2025 – Region VII",
    summary:
      "2025 regional land-cover map (ENR class codes) covering the four provinces, with area summarised by class for the preview.",
    tags: ["land cover", "2025", "enr class", "lcm"],
    preview: { fields: ["LCM_CLASS", "AREA_HA"], percent: "0.1%", precision: 2, minArea: 0.0005 },
  }),
  D({
    slug: "landcover-2020-r7",
    cat: "land-forest",
    file: "Region VII LANCOVER 2020/LCM2020_R7_PH_UTMZ51_PRS92.shp",
    dissolve: "CLASS_NAME",
    sum: "AREA_HA",
    title: "Land Cover 2020 – Region VII",
    summary:
      "2020 regional land-cover map with class names and hectares, the baseline used for forest-cover change analysis.",
    tags: ["land cover", "2020", "lcm"],
    preview: { fields: ["CLASS_NAME", "AREA_HA"], percent: "0.1%", precision: 2, minArea: 0.0005 },
  }),
  D({
    slug: "landcover-2015-r7",
    cat: "land-forest",
    file: "2015_Landcover/2015_LANDCOVER_R7.shp",
    dissolve: "AGG12",
    sum: "HECTARE",
    title: "Land Cover 2015 – Region VII",
    summary: "2015 land-cover map for Central Visayas aggregated to 12 land-cover classes.",
    tags: ["land cover", "2015"],
    preview: { fields: ["AGG12", "HECTARE"], percent: "0.2%", precision: 2, minArea: 0.0005 },
  }),
  D({
    slug: "landcover-2010-r7",
    cat: "land-forest",
    file: "2010LandCoverphilippines_utmLuz1911/REgion7_landcover.shp",
    dissolve: "AGG14",
    sum: "HECTARE",
    title: "Land Cover 2010 – Region VII",
    summary: "2010 land-cover map for Central Visayas aggregated to 14 land-cover classes.",
    tags: ["land cover", "2010"],
    preview: { fields: ["AGG14", "HECTARE"], percent: "0.5%", precision: 2, minArea: 0.0005 },
  }),
  D({
    slug: "forest-cover-2003-r7",
    cat: "land-forest",
    file: "2003 Forest_Landcover of the Philippines-Official/2003_Land_Cover_of_the_Philippines_Official.shp",
    filter: "REGION == 'REGION7'",
    dissolve: "2003LCOVER",
    sum: "HECTARE",
    title: "Forest / Land Cover 2003 – Region VII",
    summary:
      "Official 2003 land-cover and forest-cover map, filtered to Region VII and summarised by 2003 land-cover class.",
    tags: ["forest cover", "land cover", "2003", "historical"],
    preview: { fields: ["2003LCOVER", "HECTARE"], percent: "0.5%", precision: 2, minArea: 0.0005 },
  }),
  D({
    slug: "forest-cover-2020-r7",
    cat: "land-forest",
    file: "Region VII LANCOVER 2020/SHAPEFILES/FOREST_COVER.shp",
    dissolve: "CLASS_NAME",
    sum: "AREA_HA",
    title: "Forest Cover 2020 – Region VII",
    summary: "Forest-cover polygons extracted from the 2020 land-cover map, with hectares by forest class.",
    tags: ["forest cover", "2020", "forest"],
    preview: { fields: ["CLASS_NAME", "AREA_HA"], percent: "0.5%", precision: 2, minArea: 0.0005 },
  }),
  D({
    slug: "production-forest-r7",
    cat: "land-forest",
    file: "Region VII PRODUCTION AREAS/R7_Production_Areas_PRS1992.shp",
    title: "Production Forest Areas – Region VII",
    summary: "Areas classified for production forest use under the regional forest-land-use plan.",
    tags: ["production forest", "forest land use"],
    preview: { fields: ["ppf", "province"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "protection-forest-r7",
    cat: "land-forest",
    file: "Region VII PROTECTION AREAS/R7_Protection_Areas_PRS1992.shp",
    title: "Protection Forest Areas – Region VII",
    summary: "Areas classified for protection forest use under the regional forest-land-use plan.",
    tags: ["protection forest", "forest land use"],
    preview: { fields: ["ppf", "province"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "production-protection-forest-r7",
    cat: "land-forest",
    file: "Region VII PRODUCTION AND PROTECTION FOREST/PPF-Production and Protection Forests.shp",
    title: "Production and Protection Forest Zones – Region VII",
    summary: "Designated production and protection forest zones with declared area in hectares.",
    tags: ["production forest", "protection forest", "zoning"],
    preview: { fields: ["type_zone", "area_ha"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "slope-r7",
    cat: "land-forest",
    file: "Slope/slope ( cebu, bohol & siquijor ).shp",
    crs: PRS92,
    dissolve: "DESCRIPTIO",
    copy: "HECTARES",
    title: "Slope Classification – Cebu, Bohol and Siquijor",
    summary: "Slope classes and hectares for Cebu, Bohol and Siquijor, used in land-use and erosion screening.",
    tags: ["slope", "erosion", "terrain"],
    preview: { fields: ["DESCRIPTIO", "HECTARES"], percent: "0.5%", precision: 2, minArea: 0.0005 },
  }),
  D({
    slug: "soil-r7",
    cat: "land-forest",
    file: "THEMATIC MAPS OF R7/soil.shp",
    crs: PRS92,
    title: "Soil Map – Region VII",
    summary: "Regional soil-order map from the R7 thematic map series.",
    tags: ["soil", "soil order"],
    preview: { fields: ["DESCRIPT", "SOILORDER"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "climate-r7",
    cat: "land-forest",
    file: "Region VII Climate Maps/R7_Climate_Map_PRS1992.shp",
    dissolve: "climate",
    copy: "province",
    title: "Climate Map – Region VII",
    summary: "Climate-type zones by city/municipality from the regional climate map.",
    tags: ["climate", "rainfall", "zoning"],
    preview: { fields: ["climate", "province"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "geology-r7",
    cat: "land-forest",
    file: "Region VII Geologic Areas/R7_Geologic_Areas_PRS1992.shp",
    title: "Geologic Areas – Region VII",
    summary: "Geologic map units and formation descriptions for Central Visayas.",
    tags: ["geology", "formation", "bedrock"],
    preview: { fields: ["formunitna", "formabbrev", "ruleid_age"], percent: "1%", precision: 3, minArea: 0.0002 },
  }),
  D({
    slug: "erosion-r7",
    cat: "land-forest",
    file: "THEMATIC MAPS OF R7/erosion.shp",
    crs: PRS92,
    title: "Erosion Map – Region VII",
    summary: "Erosion susceptibility classes from the R7 thematic map series.",
    tags: ["erosion", "soil"],
    preview: { fields: ["DESCRIPT", "SYMBOL"], percent: "1%", precision: 3, minArea: 0.0002 },
  }),

  /* ------------------------------------------------------------ WATER */
  D({
    slug: "watersheds-r7",
    cat: "water",
    file: "PHD Watershed Data/SHP/Region7_IFSAR_Watersheds_10k.shp",
    title: "Watersheds – Region VII",
    summary:
      "IFSAR-derived 1:10,000 watershed boundaries for Region VII with watershed names and area in square kilometres.",
    tags: ["watershed", "ifsar", "10k", "catchment"],
    preview: { fields: ["Name", "WATERSHED", "Area_km²"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "major-river-basins-r7",
    cat: "water",
    file: "Region VII  MAJOR RIVER BASINS/R7_Major_River_Basins_PRS1992.shp",
    title: "Major River Basins – Region VII",
    summary: "Major river basin boundaries and names for Central Visayas.",
    tags: ["river basin", "watershed", "basin"],
    preview: { fields: ["name", "oldname", "gridcode"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "critical-watersheds-r7",
    cat: "water",
    file: "Region VII Critical Watersheds/WS_CRITICAL - Critical Watersheds.shp",
    title: "Critical Watersheds – Region VII",
    summary:
      "Watersheds with critical watershed status, including regional coverage, size class and management-program status.",
    tags: ["critical watershed", "iwmp", "watershed"],
    preview: { fields: ["w_name", "w_size", "stat_crva", "stat_iwmp", "area_ha"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "proclaimed-watersheds-r7",
    cat: "water",
    file: "Region VII PROCLAIMED WATERSHEDS/WS_PROC - Proclaimed Watersheds.shp",
    title: "Proclaimed Watersheds – Region VII",
    summary: "Watersheds proclaimed by legal instrument, with proclamation basis and managing agency.",
    tags: ["proclaimed watershed", "legal", "watershed"],
    preview: { fields: ["w_name", "lgal_basis", "r_agency", "area_ha"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "river-network-r7",
    cat: "water",
    file: "Region VII RIVER NETWORKS/R7_River_Networks_PRS1992.shp",
    title: "River Network – Region VII",
    summary: "Regional river network with named and unnamed reaches and reach length.",
    tags: ["river", "stream", "network"],
    preview: { fields: ["name", "length_met", "source"], percent: "3%", precision: 3 },
  }),
  D({
    slug: "inland-wetlands-r7",
    cat: "water",
    file: "Region VII Inland Wetlands/R7_Inland_Wetlands.shp",
    title: "Inland Wetlands – Region VII",
    summary:
      "Inland wetlands with water-body classification, watershed, elevation and recognition status.",
    tags: ["wetland", "inland water", "ramsar"],
    preview: { fields: ["l_name", "w_type", "wbody_cls", "watershed", "elevation"], percent: "2%", precision: 3 },
  }),
  ...[
    ["watershed-acar", "ACAR_Wat_Bdry.shp", "ACAR Watershed Boundary", "ACAR watershed boundary and barangay/municipal attribution."],
    ["watershed-alegria-badian", "Alegria_Badian_Wat_Bdry.shp", "Alegria–Badian Watershed Boundary", "Alegria–Badian watershed boundary under the regional watershed assessment."],
    ["watershed-carood", "Carood_Wat_Bdry.shp", "Carood Watershed Boundary", "Carood watershed boundary and municipal coverage."],
    ["watershed-ccrb", "CCRB_Bdry.shp", "Central Cebu River Basin (CCRB) Boundary", "Central Cebu river basin boundary used for watershed and land-cover assessment."],
    ["watershed-ilog-hilabangan", "Ilog_Hilabangan_River_Basin_Bdry.shp", "Ilog–Hilabangan River Basin Boundary", "Ilog–Hilabangan river basin boundary in Negros Oriental."],
    ["watershed-loboc", "Loboc_Wat_Bdry_Assessment.shp", "Loboc Watershed Boundary", "Loboc watershed boundary under the regional watershed assessment."],
    ["watershed-wahig-inabanga", "Wahig_Inabanga_URB_Bdry.shp", "Wahig–Inabanga River Basin Boundary", "Wahig–Inabanga river basin boundary in Bohol."],
  ].map(([slug, file, title, summary]) =>
    D({
      slug,
      cat: "water",
      file: `WATERSHEDS BOUNDARY/${file}`,
      title,
      summary,
      tags: ["watershed", "sub-watershed", "assessment"],
      preview: { fields: ["Name", "name", "MUNICIPALI", "HECTARES", "AREA", "area_ha"], percent: "2%", precision: 3 },
    }),
  ),
  D({
    slug: "water-districts-ph",
    cat: "water",
    file: "WATER DISTRICTS OF PH/Water Districts in the Philippines.shp",
    title: "Water Districts of the Philippines",
    summary:
      "Directory of water districts with location points, service area, management contacts and LWUA status.",
    tags: ["water district", "lwua", "water supply"],
    preview: { fields: ["water_dist", "full_addre", "lwua_sta"], percent: "0%", precision: 3 },
  }),
  D({
    slug: "18-major-river-basins-ph",
    cat: "water",
    file: "PHD Watershed Data/SHP/18 Major Basins/18_Major_RBs.shp",
    title: "18 Major River Basins of the Philippines",
    summary: "National extent of the 18 major river basins, shown for context against Region VII basins.",
    tags: ["river basin", "national", "context"],
    preview: { fields: ["Name", "Area_km²"], percent: "1%", precision: 3, minArea: 0.0002 },
    provinces: ["bohol", "cebu", "negros-oriental", "siquijor"],
  }),

  /* -------------------------------------------------------- PROTECTED AREAS */
  D({
    slug: "protected-areas-r7",
    cat: "protected-areas",
    file: "Region VII PROTECTED AREAS/Projected PA/Protected Area.shp",
    title: "Protected Areas – Region VII",
    summary:
      "Legislated protected areas in Central Visayas with category, legal basis, ecosystem and land/marine area.",
    tags: ["protected area", "nipas", "paws", "biodiversity"],
    preview: { fields: ["PA_NAME", "CATEGORY", "LEG_BASIS", "LAND_AREA", "MARINE_ARE"], percent: "1%", precision: 3 },
  }),
  D({
    slug: "cebu-protected-areas",
    cat: "protected-areas",
    file: "Region VII PROTECTED AREAS/Cebu Protected Area.shp",
    title: "Protected Areas – Cebu",
    summary: "Protected areas within Cebu province with category, legal status and area.",
    tags: ["protected area", "cebu"],
    preview: { fields: ["PA_NAME", "CATEGORY", "LEG_STAT", "LAND_AREA"], percent: "1%", precision: 3 },
  }),
  D({
    slug: "bohol-protected-areas",
    cat: "protected-areas",
    file: "Region VII PROTECTED AREAS/Projected PA/Bohol Protected Areas.shp",
    title: "Protected Areas – Bohol",
    summary: "Protected areas within Bohol province with category, legal status and area.",
    tags: ["protected area", "bohol"],
    preview: { fields: ["pa_name", "category", "leg_stat", "land_area"], percent: "1%", precision: 3 },
  }),
  D({
    slug: "nipas-r7",
    cat: "protected-areas",
    file: "THEMATIC MAPS OF R7/nipas.shp",
    crs: PRS92,
    title: "NIPAS Areas – Region VII (Thematic Map)",
    summary:
      "NIPAS proclaimed areas from the R7 thematic map series, with proclamation number, status and location attributes.",
    tags: ["nipas", "protected area", "thematic map"],
    preview: { fields: ["PANAME", "DESC", "STATUS", "PROVINCE", "HECTARES"], percent: "1%", precision: 3 },
  }),
  D({
    slug: "camotes-island-pls",
    cat: "protected-areas",
    file: "53. Camotes Island Protected Landscape and Seascape/fwdciplsmanagementzones/merge_MUZ_SPZ_CIPLS_final.shp",
    title: "Camotes Island Protected Landscape and Seascape – Management Zones",
    summary:
      "Multiple-use and strict-protection zones of the Camotes Island Protected Landscape and Seascape.",
    tags: ["camotes", "management zone", "protected landscape", "seascape"],
    preview: { fields: ["ZONE", "FLCLASS2", "LCMAP", "MUN", "PARCEL"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "bantayan-island-wilderness-area",
    cat: "protected-areas",
    file: "Bantayan Island Wilderness Area/BIWA_Mgt_Zone_wgs84prj.shp",
    title: "Bantayan Island Wilderness Area – Management Zones",
    summary: "Management zones for the Bantayan Island Wilderness Area with land-use and barangay attribution.",
    tags: ["bantayan", "wilderness area", "management zone"],
    preview: { fields: ["ZONE_1", "NAME_1", "BARANGAY_1", "HECTARES"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "bantayan-proposed-zoning",
    cat: "protected-areas",
    file: "Proposed Zoning for Bantayan Island Protected Landscape and Seascape/Bantayan Island.shp",
    title: "Proposed Zoning – Bantayan Island Protected Landscape and Seascape",
    summary: "Proposed management zoning for the Bantayan Island Protected Landscape and Seascape.",
    tags: ["bantayan", "zoning", "protected landscape"],
    preview: { fields: ["Name", "PA_NAME", "Area"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "urban-green-spaces-r7",
    cat: "protected-areas",
    file: "Region VII URBAN GREEN SPACES/UGS- Urban Green Spaces.shp",
    title: "Urban Green Spaces – Region VII",
    summary: "Mapped urban green spaces with type, use and declared area.",
    tags: ["urban green space", "parks", "green infrastructure"],
    preview: { fields: ["type_ugs", "ugs_use", "area_ugs", "muni_city"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "classified-caves-r7",
    cat: "protected-areas",
    file: "Region VII Classified Caves/R7_Classified_Caves.shp",
    title: "Classified Caves – Region VII",
    summary:
      "Classified cave localities with cave classification, threats, management plan status and protected-area linkage.",
    tags: ["cave", "karst", "biodiversity"],
    preview: { fields: ["cv_name", "cave_class", "province", "muni_city", "yr_classi", "cave_haz"], percent: "0%", precision: 3 },
  }),

  /* --------------------------------------------------------------- TENURE */
  D({
    slug: "tenurial-cbfma-r7",
    cat: "tenure",
    file: "TENURIAL INSTRUMENTS_MERGE-SHP/R7_CBFMA.shp",
    title: "Community-Based Forest Management Agreements (CBFMA) – Region VII",
    summary:
      "CBFM agreement areas with agreement number, issuance/expiry dates, people's organisation and watershed.",
    tags: ["cbfm", "tenure", "community forest"],
    preview: { fields: ["CBFMA_NO", "MUNI_CITY", "DATE_ISSD", "DATE_EXPD", "AREA_HA"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "tenurial-cadc-r7",
    cat: "tenure",
    file: "TENURIAL INSTRUMENTS_MERGE-SHP/R7_CADC.shp",
    title: "Certificate of Ancestral Domain Claim (CADC) – Region VII",
    summary: "CADC areas with control number, issuance/expiry dates and municipal coverage.",
    tags: ["cadc", "ancestral domain", "tenure"],
    preview: { fields: ["CTRL_NO", "MUNI_CITY", "DATE_ISSD", "DATE_EXPD", "AREA_HA"], percent: "2%", precision: 3 },
  }),
  ...[
    ["tenurial-fleg-r7", "R7_FLAg.shp", "Forest Land Grazing Lease (FLAg) – Region VII", "fla", "Forest land grazing lease agreements with control number and area."],
    ["tenurial-flma-r7", "R7_FLMA.shp", "Forest Land Management Agreement (FLMA) – Region VII", "flma", "Forest land management agreements with control number and area."],
    ["tenurial-ifma-r7", "R7_IFMA.shp", "Integrated Forest Management Agreement (IFMA) – Region VII", "ifma", "Integrated forest management agreements with control number and area."],
    ["tenurial-sifma-r7", "R7_SIFMA.shp", "Socialized Integrated Forest Management Agreement (SIFMA) – Region VII", "sifma", "Socialized integrated forest management agreements with control number and area."],
    ["tenurial-splula-r7", "R7_SPLULA.shp", "Special Land Use Lease Agreement (SPLULA) – Region VII", "splula", "Special land-use lease agreements with control number and area."],
    ["tenurial-tfla-r7", "R7_TFLA.shp", "Tree Farm Lease Agreement (TFLA) – Region VII", "tfla", "Tree farm lease agreements with control number and area."],
    ["tenurial-moa-r7", "R7_MOA.shp", "Memorandum of Agreement (MOA) Tenures – Region VII", "moa", "MOA-based tenure parcels with agreement number and municipal coverage."],
  ].map(([slug, file, title, tag, summary]) =>
    D({
      slug,
      cat: "tenure",
      file: `TENURIAL INSTRUMENTS_MERGE-SHP/${file}`,
      title,
      summary,
      tags: [tag, "tenure"],
      preview: { fields: ["CTRL_NO", "MUNI_CITY", "DATE_ISSD", "DATE_EXPD", "AREA_HA", "NAME", "PROVINCE"], percent: "2%", precision: 3 },
    }),
  ),
  D({
    slug: "tenurial-slup-2014-r7",
    cat: "tenure",
    file: "TENURIAL INSTRUMENTS_MERGE-SHP/R7_SLUP_ASDEC2014.shp",
    title: "Special Land Use Permit (SLUP) 2014 – Region VII",
    summary: "SLUP parcels issued as of December 2014, with control number and area.",
    tags: ["slup", "special land use", "tenure"],
    preview: { fields: ["CTRL_NO", "MUNI_CITY", "DATE_ISSD", "DATE_EXPD", "AREA_HA"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "tenurial-slup-2015-r7",
    cat: "tenure",
    file: "TENURIAL INSTRUMENTS_MERGE-SHP/R7_SLUP_ASDEC2015.shp",
    title: "Special Land Use Permit (SLUP) 2015 – Region VII",
    summary: "SLUP parcels issued as of December 2015, with control number and area.",
    tags: ["slup", "special land use", "tenure"],
    preview: { fields: ["CTRL_NO", "MUNI_CITY", "DATE_ISSD", "DATE_EXPD", "AREA_HA"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "cadt-r7",
    cat: "tenure",
    file: "PH CADT/Philippines CADT's.shp",
    filter: "region == 'Region VII'",
    title: "Certificates of Ancestral Domain Title (CADT) – Region VII",
    summary: "CADT areas for Region VII with title number, ICC/IP group, location and approved area.",
    tags: ["cadt", "ancestral domain", "ip", "tenure"],
    preview: { fields: ["cadt_no", "iccs_ips", "location", "area_ha", "date_appro"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "cutting-permit-areas-r7",
    cat: "tenure",
    file: "Region VII Cutting Area Permit/PERMIT_CUT_AREA - Cutting Permit Area.shp",
    title: "Cutting Permit Areas – Region VII",
    summary: "Areas covered by timber cutting permits, with permit type, species, volume and tree count.",
    tags: ["cutting permit", "timber", "permit"],
    preview: { fields: ["tcp_number", "type_cp", "species", "volume", "qty_trees", "muni_city"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "cutting-permits-r7",
    cat: "tenure",
    file: "Region VII Cutting Permits/PERMIT_CUT_POINT - Cutting Permit.shp",
    title: "Cutting Permit Points – Region VII",
    summary: "Point locations of timber cutting permits with permit metadata.",
    tags: ["cutting permit", "timber", "permit"],
    preview: { fields: ["tcp_number", "type_cp", "species", "qty_trees", "muni_city", "date"], percent: "0%", precision: 3 },
  }),
  D({
    slug: "mpsa-r7",
    cat: "tenure",
    file: "Region VII MPSA/R7_MPSA_Feb2026.shp",
    title: "Mineral Production Sharing Agreements (MPSA) – Region VII",
    summary: "MPSA tenements as of February 2026 with commodity, holder type and approved area.",
    tags: ["mpsa", "mining", "tenement"],
    preview: { fields: ["commodity", "approved", "area", "mun_city", "province", "ten_type"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "epsa-r7",
    cat: "tenure",
    file: "Region VII EPSA/R7_EP_Feb2026.shp",
    title: "Exploration Permit Applications (EPSA) – Region VII",
    summary: "Exploration permit applications as of February 2026 with commodity and area.",
    tags: ["epsa", "exploration", "mining"],
    preview: { fields: ["commodity", "approved", "area", "mun_city", "province"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "ipsa-r7",
    cat: "tenure",
    file: "Region VII IPSA/R7_IP_Feb2026.shp",
    title: "Industrial Sand and Gravel Permits (IPSA) – Region VII",
    summary: "Industrial sand and gravel permit applications with commodity and area.",
    tags: ["ipsa", "sand and gravel", "mining"],
    preview: { fields: ["commodity", "approved", "area", "mun_city", "province", "descriptio"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "apsa-r7",
    cat: "tenure",
    file: "Region VII APSA/R7_APSA_Feb2026.shp",
    title: "Mineral Processing / Quarry Applications (APSA) – Region VII",
    summary: "APSA tenements as of February 2026 with commodity, area and provincial coverage.",
    tags: ["apsa", "quarry", "mining"],
    preview: { fields: ["commodity", "approved", "area", "province", "remarks"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "ipa-r7",
    cat: "tenure",
    file: "Region VII IPA/R7_IPA_Feb2026.shp",
    title: "Industrial Permit Areas (IPA) – Region VII",
    summary: "Industrial permit areas as of February 2026 with commodity and area.",
    tags: ["ipa", "industrial", "mining"],
    preview: { fields: ["commodity", "approved", "area", "mun_city", "province"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "sapa-r7",
    cat: "tenure",
    file: "Region VII SAPA/R7_SAPA.shp",
    title: "Special Allotment and Production Agreements (SAPA) – Region VII",
    summary: "SAPA project areas with project type, holder, effectivity dates and area.",
    tags: ["sapa", "tenure", "production"],
    preview: { fields: ["sapa_no", "proj_name", "proj_type", "date_app", "date_exp", "area_ha"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "engp-r7",
    cat: "tenure",
    file: "Region VII ENGP/R7 ENGP.shp",
    title: "Enhanced National Greening Program (ENGP) – Region VII",
    summary: "ENGP plantation parcels with species, contractor, tenure, area and establishment year.",
    tags: ["engp", "greening", "plantation", "reforestation"],
    preview: { fields: ["commodity", "species", "area_ha", "muni_city", "yr_estab", "tenure", "stat_reg"], percent: "1%", precision: 2, minArea: 0.0002 },
  }),
  D({
    slug: "other-projects-r7",
    cat: "tenure",
    file: "Region VII Other Projects/OTHR_PROJS - Other Projects.shp",
    title: "Other DENR Projects – Region VII",
    summary: "Other DENR project areas with modality, funding type, start/end dates and municipality.",
    tags: ["project", "denr", "funding"],
    preview: { fields: ["name_proj", "modality", "type_fund", "muni_city", "start_date", "end_date", "area_ha"], percent: "1%", precision: 2, minArea: 0.0002 },
  }),
  D({
    slug: "potential-investment-areas-r7",
    cat: "tenure",
    file: "Region VII POTENTIAL INVESTMENT AREAS/PPF_PIA - Potential Investment Areas.shp",
    title: "Potential Investment Areas – Region VII",
    summary: "Areas identified for potential forest-based investment, with investment type and area.",
    tags: ["investment", "forest", "zoning"],
    preview: { fields: ["type_invst", "area_ha", "muni_city", "year_gd"], percent: "1%", precision: 2, minArea: 0.0002 },
  }),
  D({
    slug: "wood-processing-plants-r7",
    cat: "tenure",
    file: "Region VII WOOD PROCESSING PLANT/PERMIT_WPP - Wood Processing Plant.shp",
    title: "Wood Processing Plants – Region VII",
    summary: "Permitted wood processing plants with permit status, capacity and municipality.",
    tags: ["wood processing", "permit", "forest products"],
    preview: { fields: ["type_wpp", "status", "cap_dr", "muni_city", "date_issd", "date_expy"], percent: "0%", precision: 3 },
  }),
  D({
    slug: "seed-production-areas-r7",
    cat: "tenure",
    file: "Region VII SEED PROUCTION AREAS/DENR_SPA - Seed Production Areas.shp",
    title: "Seed Production Areas – Region VII",
    summary: "Established seed production areas with species, area and year established.",
    tags: ["seed production", "nursery", "reforestation"],
    preview: { fields: ["species_sp", "area_ha", "muni_city", "yr_estab"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "clonal-nurseries-r7",
    cat: "tenure",
    file: "Region VII Established Mechanized Modernized Nurseries/DENR MMFN - Established Mechanized and Modernized Nurseries.shp",
    title: "Mechanized and Modernized Nurseries – Region VII",
    summary: "Established mechanized and modernized nurseries with seedling capacity and staffing.",
    tags: ["nursery", "seedlings", "reforestation"],
    preview: { fields: ["muni_city", "cap_sdlngs", "no_staff", "yr_const", "stat_nrsry"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "arboretum-r7",
    cat: "tenure",
    file: "DENR Region VII ARBORETUM/DENR_ARBO - Arboretum.shp",
    title: "DENR Region VII Arboretum",
    summary: "Arboretum sites managed by DENR Region VII with area, district and year established.",
    tags: ["arboretum", "botanical", "denr"],
    preview: { fields: ["muni_city", "area_ha", "district", "yr_estab", "mngt"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "swcm-r7",
    cat: "tenure",
    file: "Region VII SOIL AND WATER CONSERVATION MEASURES/SWCM - Soil and Water Conservation Measures.shp",
    title: "Soil and Water Conservation Measures – Region VII",
    summary: "Implemented soil and water conservation measures with category, management and year constructed.",
    tags: ["soil conservation", "water conservation", "swcm"],
    preview: { fields: ["cat_swcm", "swcm_mgmt", "muni_city", "yr_const", "status"], percent: "0%", precision: 3 },
  }),
  D({
    slug: "watershed-instrumentation-r7",
    cat: "water",
    file: "Region VII Established Watershed Instrumentations/WINS - Established Watershed Instrumentations.shp",
    title: "Watershed Instrumentation – Region VII",
    summary: "Established watershed monitoring instruments with type, watershed and year constructed.",
    tags: ["instrumentation", "monitoring", "watershed"],
    preview: { fields: ["type_inst", "w_name", "muni_city", "yr_const", "status"], percent: "0%", precision: 3 },
  }),
  D({
    slug: "forest-ranger-stations-r7",
    cat: "tenure",
    file: "Region VII DENR Region VII Forest Ranger Station Lookout Towers/DENR_FRS - DENR Forest Ranger Stations Lookout Towers.shp",
    title: "Forest Ranger Stations and Lookout Towers – Region VII",
    summary: "Locations of DENR forest ranger stations and lookout towers with station type and status.",
    tags: ["ranger station", "lookout tower", "enforcement"],
    preview: { fields: ["cat_fstat", "type_const", "muni_city", "status", "yr_const"], percent: "0%", precision: 3 },
  }),
  D({
    slug: "denr-field-offices-r7",
    cat: "admin-boundaries",
    file: "Region VII DENR Field Offices/DENR_FO - DENR Field Offices.shp",
    title: "DENR Field Offices – Region VII",
    summary: "Locations of DENR regional, provincial and community field offices.",
    tags: ["denr", "office", "cenro", "penro"],
    preview: { fields: ["type_fo", "cenro", "penro", "muni_city"], percent: "0%", precision: 3 },
  }),
  D({
    slug: "bdfe-r7",
    cat: "tenure",
    file: "Region VII Biodiversity Friendly Enterprise/R7_BDFE.shp",
    title: "Biodiversity-Friendly Enterprises – Region VII",
    summary: "Biodiversity-friendly enterprises with enterprise type, product, registration and financial attributes.",
    tags: ["bdfe", "enterprise", "livelihood", "biodiversity"],
    preview: { fields: ["ent_name", "ent_type", "product", "bdfe_level", "muni_city", "province"], percent: "0%", precision: 3 },
  }),
  D({
    slug: "lawin-patrol-routes-r7",
    cat: "tenure",
    file: "CEBU LAWIN PATROL MAPS/region7_maps_sdrmd_dbowner_R7_Lawin_Patrol_Routes_PRS92_UTM_Z51N selection.shp",
    title: "Lawin Patrol Routes – Region VII",
    summary: "Forest protection patrol routes with patrol identifiers, lead and conservation area.",
    tags: ["lawin", "patrol", "forest protection", "enforcement"],
    preview: { fields: ["patrol_id", "leader", "conservati", "type"], percent: "3%", precision: 3 },
  }),
  D({
    slug: "cebu-firelines",
    cat: "tenure",
    file: "CEBU FIRELINES/CEBU FIRELINES.shp",
    title: "Cebu Firelines",
    summary: "Fireline polygons with barangay, watershed, land cover, species and plantation establishment details.",
    tags: ["fireline", "plantation", "cebu", "reforestation"],
    preview: { fields: ["barangay", "watershed", "land_cover", "species", "year", "province"], percent: "2%", precision: 3 },
  }),

  /* --------------------------------------------------------------- COASTAL */
  D({
    slug: "mangroves-cmemp-r7",
    cat: "coastal",
    file: "Region VII Coastal and Marine Ecosystems Management Program Mangroves/R7_CMEMP_Mangroves.shp",
    title: "Mangroves (CMEMP) – Region VII",
    summary: "Mangrove areas under the Coastal and Marine Ecosystems Management Program with species and area.",
    tags: ["mangrove", "cmemp", "coastal"],
    preview: { fields: ["mangrove_c", "mangrove_s", "muni_city", "total_area", "total_spp"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "corals-cmemp-r7",
    cat: "coastal",
    file: "Region VII Coastal and Marine Ecosystems Management Program Corals/R7_CMEMP_Corals.shp",
    title: "Coral Cover (CMEMP) – Region VII",
    summary: "Coral-cover assessment polygons with live coral category, value and dominant species.",
    tags: ["coral", "reef", "cmemp"],
    preview: { fields: ["coral_spp", "hcc_catgy", "hcc_val", "area_cover", "muni_city"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "seagrass-cmemp-r7",
    cat: "coastal",
    file: "Region VII Coastal and Marine Ecosystems Management Program Seagrass/R7_CMEMP_Seagrass.shp",
    title: "Seagrass Beds (CMEMP) – Region VII",
    summary: "Seagrass assessment polygons with cover, dominant species and total species count.",
    tags: ["seagrass", "cmemp", "coastal"],
    preview: { fields: ["dominant_s", "area_cover", "total_spp", "muni_city"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "mpa-network-cmemp-r7",
    cat: "coastal",
    file: "Region VII Coastal and Marine Ecosystems Management Program Marine Protected Area Network/R7_CMEMP_MPA_Network.shp",
    title: "Marine Protected Area Network (CMEMP) – Region VII",
    summary: "Marine protected area network extent under CMEMP with category, management status and legal instrument.",
    tags: ["mpa", "mpan", "cmemp"],
    preview: { fields: ["mpan_name", "mpan_cat", "mpan_statu", "legal_ins", "mpan_area"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "cmemp-bdfe-po-r7",
    cat: "coastal",
    file: "Region VII Coastal and Marine Ecosystems Management Program BDFE/R7_CMEMP_BDFE_PO.shp",
    title: "CMEMP Biodiversity-Friendly Enterprise People's Organizations",
    summary: "People's organizations supported under CMEMP with enterprise type, product and membership.",
    tags: ["bdfe", "people's organization", "cmemp"],
    preview: { fields: ["po_name", "ent_type", "product_se", "muni_city", "province"], percent: "0%", precision: 3 },
  }),
  D({
    slug: "cmemp-water-quality-r7",
    cat: "environment",
    file: "Region VII Coastal and Marine Ecosystems Management Program Water Quality Areas/R7_CMEMP_Water_Quality.shp",
    title: "Water Quality Monitoring Sites (CMEMP) – Region VII",
    summary:
      "Coastal water-quality sampling sites with pH, dissolved oxygen, nitrate, phosphate, temperature and weather.",
    tags: ["water quality", "monitoring", "cmemp"],
    preview: { fields: ["samp_site", "river_syst", "muni_city", "province", "date", "ph", "do_", "nitrate", "phosphate"], percent: "0%", precision: 3 },
  }),
  D({
    slug: "locally-mpa-network-r7",
    cat: "coastal",
    file: "Region VII Locally Marine Protected Area Network/R7_LMMPA.shp",
    title: "Locally Managed Marine Protected Areas – Region VII",
    summary: "Locally managed marine protected areas with establishment year, legal instrument and area.",
    tags: ["mpa", "lmmpa", "local"],
    preview: { fields: ["lmmpa_name", "lmmpa_id", "est_yr", "legal_ins", "lmmpa_area", "province"], percent: "0%", precision: 3 },
  }),
  D({
    slug: "mpa-network-r7",
    cat: "coastal",
    file: "Region VII Marine Protected Area Networking/R7_MPAN.shp",
    title: "Marine Protected Area Network – Region VII",
    summary: "MPA network polygons with category, management status, legal instrument and area.",
    tags: ["mpa", "mpan", "network"],
    preview: { fields: ["mpan_name", "mpan_catgy", "mpan_statu", "legal_ins", "mpan_area"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "visayan-sea-fishponds",
    cat: "coastal",
    file: "VISAYAN SEA/TSPS_FISHPOND.shp",
    title: "Fishponds – Visayan Sea / Tañon Strait",
    summary: "Fishpond areas in the Visayan Sea and Tañon Strait assessment, with municipal coverage and hectares.",
    tags: ["fishpond", "aquaculture", "visayan sea"],
    preview: { fields: ["MUNICIPALI", "PROVINCE", "HECTARE", "AGG12"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "visayan-sea-mangroves",
    cat: "coastal",
    file: "VISAYAN SEA/TSPS_MANGROVE.shp",
    title: "Mangroves – Visayan Sea / Tañon Strait",
    summary: "Mangrove polygons in the Visayan Sea and Tañon Strait assessment, with municipal coverage and hectares.",
    tags: ["mangrove", "visayan sea", "tanon strait"],
    preview: { fields: ["MUNICIPALI", "PROVINCE", "HECTARE", "AGG12"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "visayan-sea-sanctuaries",
    cat: "coastal",
    file: "VISAYAN SEA/SANCTUARY_VISAYAN_SEA.shp",
    title: "Marine Sanctuaries – Visayan Sea",
    summary: "Marine sanctuary areas in the Visayan Sea with province and declared hectares.",
    tags: ["sanctuary", "visayan sea", "marine"],
    preview: { fields: ["PROVINCE", "REGION", "HECTARES"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "philippines-eez",
    cat: "coastal",
    file: "Philippines EEZ/Philippines EEZ.shp",
    title: "Philippine Exclusive Economic Zone",
    summary: "National EEZ boundary shown for maritime context around Region VII.",
    tags: ["eez", "maritime", "national"],
    preview: { fields: ["geoname", "pol_type", "area_km2"], percent: "2%", precision: 3, minArea: 0.01 },
  }),
  D({
    slug: "r7-coastline",
    cat: "coastal",
    file: "PHD Watershed Data/SHP/r7coastline.shp",
    title: "Coastline – Region VII",
    summary: "Region VII coastline derived from the watershed data package, by province.",
    tags: ["coastline", "shoreline"],
    preview: { fields: ["PROVINCE", "REGION"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "asian-waterbird-census-r7",
    cat: "coastal",
    file: "Region VII Asian Waterbird Census/R7_AWC_Sites.shp",
    title: "Asian Waterbird Census Sites – Region VII",
    summary: "Waterbird census sites with species count, total population, census date and protected-area linkage.",
    tags: ["waterbird", "census", "biodiversity", "wetland"],
    preview: { fields: ["awc_site", "ch_name", "muni_city", "province", "no_spp", "total_pop", "date_cns"], percent: "0%", precision: 3 },
  }),
  D({
    slug: "bams-ccpl",
    cat: "environment",
    file: "Central Cebu Protected Landscape Biodiversity Monitoring Systems/BAMS_CCPL.shp",
    title: "Biodiversity Monitoring System – Central Cebu Protected Landscape",
    summary:
      "Permanent biodiversity monitoring plots in the CCPL with species, diameter, height, bearings and monitoring dates.",
    tags: ["biodiversity", "monitoring", "bams", "ccpl"],
    preview: { fields: ["sci_name", "comm_name", "dbh", "mh", "date_invt", "bams_quadr"], percent: "0%", precision: 3 },
  }),

  /* ----------------------------------------------------------- ENVIRONMENT */
  D({
    slug: "flood-susceptibility-r7",
    cat: "environment",
    file: "Region VII DENR MGB Geohazards Suspectibility 10k Scale/Flooding_RegionVII.shp",
    dissolve: "FloodSusc",
    title: "Flood Susceptibility – Region VII (1:10,000)",
    summary:
      "MGB 1:10,000 flood susceptibility classes for Region VII, aggregated by susceptibility level for display.",
    tags: ["flood", "geohazard", "susceptibility", "mgb"],
    preview: { fields: ["FloodSusc"], percent: "0.5%", precision: 2, minArea: 0.0002 },
  }),
  D({
    slug: "landslide-susceptibility-r7",
    cat: "environment",
    file: "Region VII DENR MGB Geohazards Suspectibility 10k Scale/Landslide_RegionVII.shp",
    dissolve: "LndslideSu",
    title: "Landslide Susceptibility – Region VII (1:10,000)",
    summary:
      "MGB 1:10,000 landslide susceptibility classes for Region VII, aggregated by susceptibility level for display.",
    tags: ["landslide", "geohazard", "susceptibility", "mgb"],
    preview: { fields: ["LndslideSu"], percent: "0.3%", precision: 2, minArea: 0.0002 },
  }),
  ...[
    ["sinkhole-alcoy", "R7_Sinkhole_Alcoy_PRS1992.shp", "Sinkholes – Alcoy", "Mapped sinkhole points in Alcoy, Cebu, with barangay attribution."],
    ["sinkhole-dalaguete", "R7_Sinkhole_Dalaguete_PRS1992.shp", "Sinkholes – Dalaguete", "Mapped sinkhole points in Dalaguete, Cebu, with elevation and sinkhole type."],
    ["sinkhole-moalboal", "R7_Sinkhole_Moalboal_PRS1992.shp", "Sinkholes – Moalboal", "Mapped sinkhole points in Moalboal, Cebu."],
  ].map(([slug, file, title, summary]) =>
    D({
      slug,
      cat: "environment",
      file: `Region VII SINKHOLES/${file}`,
      title,
      summary,
      tags: ["sinkhole", "karst", "geohazard"],
      preview: { fields: ["name", "type", "elevation", "barangay"], percent: "0%", precision: 3 },
    }),
  ),
  D({
    slug: "earthquake-r7",
    cat: "environment",
    file: "THEMATIC MAPS OF R7/earthquake.shp",
    crs: PRS92,
    title: "Earthquake-Related Susceptibility – Region VII",
    summary: "Earthquake-related ground-shaking or landslide susceptibility from the R7 thematic map series.",
    tags: ["earthquake", "seismic", "geohazard"],
    preview: { fields: ["DESC", "LANDSLIDE_"], percent: "2%", precision: 3 },
  }),
  D({
    slug: "faultline-r7",
    cat: "environment",
    file: "THEMATIC MAPS OF R7/faultline.shp",
    crs: PRS92,
    title: "Fault Lines – Region VII",
    summary: "Mapped fault lines and related linework from the R7 thematic map series.",
    tags: ["fault line", "seismic", "geohazard"],
    preview: { fields: ["CODE", "LENGTH"], percent: "3%", precision: 3 },
  }),
];

/* -------------------------------------------------------------------- build */

// High-fidelity view mode: keep geometry accurate (no simplify / no island filter / high precision)
// so browser previews match the source shapes more closely (e.g. ArcGIS Pro). View-only.
const HIGH_FIDELITY = process.argv.includes("--hires") || process.env.PREVIEW_HIRES === "1";

function datasetFrom(entry, meta, previewFeatures, extent) {
  // The published dataset count: normally the (filtered) source record count,
  // but some entries are genuinely defined by their preview geometry (e.g. a
  // dissolved city/municipal layer), so `count: "preview"` overrides it.
  const featureCount = entry.count === "preview" ? previewFeatures : meta.records;
  const catLabel = CATEGORY_LABEL[entry.cat];
  const fields = meta.fields.map((name) => ({
    name,
    alias: titleCase(name),
    type: fieldType(name),
  }));

  const en = entry.summary;
  const fil = `Datos na pangheograpiya para sa ${entry.title} mula sa DENR Rehiyon VII. Bahagi ng ${CATEGORY_LABEL_FIL[entry.cat]}.`;

  const sourceRef =
    entry.sourceKind === "public-arcgis"
      ? entry.reference
      : entry.file.replace(/\\/g, "/");

  return {
    id: `ds-${entry.slug}`,
    slug: entry.slug,
    title: { en: entry.title, fil: entry.filTitle ?? entry.title },
    summary: { en, fil: entry.filSummary ?? fil },
    description: {
      en: `${en} The published preview is a generalized derivative of the DENR Region VII source layer; the authoritative shapefile is released only through the request process.`,
      fil: `${entry.filSummary ?? fil} Ang preview na inilathala ay pinasimpleng bersyon lamang ng orihinal na layer ng DENR Rehiyon VII; ang opisyal na shapefile ay ibinibigay lamang sa pamamagitan ng request process.`,
    },
    category: entry.cat,
    tags: entry.tags ?? [],
    publisher: "DENR Region VII",
    steward: STEWARD[entry.cat],
    geometryType: meta.geometry === "point" ? "point" : meta.geometry === "polyline" ? "polyline" : "polygon",
    featureCount,
    crs: "EPSG:4326",
    extent: fmtExtent(extent),
    preview: previewFeatures
      ? { file: `/previews/${entry.slug}.geojson`, kind: "vector" }
      : null,
    fields,
    source: {
      kind: "local",
      reference: sourceRef,
      attribution: "DENR Region VII · ENVIS geospatial holdings",
    },
    isDemo: false,
    access: "request",
    updateFrequency: entry.updateFrequency ?? "As needed",
    lastUpdated: entry.lastUpdated ?? TODAY,
    license: { name: "DENR data sharing agreement", url: "/terms" },
    citation: `Department of Environment and Natural Resources, Region VII. (2026). ${entry.title} [Vector dataset].`,
    provinces: entry.provinces ?? ["bohol", "cebu", "negros-oriental", "siquijor"],
  };
}

async function makePreview(entry, meta) {
  const target = path.join(OUT_DIR, `${entry.slug}.geojson`);
  const p = entry.preview ?? {};
  const args = ["-i", path.join(SRC, entry.file)];

  if (entry.filter) args.push("-filter", entry.filter);
  if (entry.dissolve) {
    args.push("-dissolve", entry.dissolve);
    if (entry.sum) args.push(`sum-fields=${entry.sum}`);
    if (entry.copy) args.push(`copy-fields=${entry.copy}`);
  }
  if (entry.crs) args.push("-proj", "crs=wgs84", `init=${entry.crs}`);
  else args.push("-proj", "crs=wgs84");

  if (!HIGH_FIDELITY && p.minArea) args.push("-filter-islands", `min-area=${p.minArea}`);

  const keep = (p.fields ?? []).filter(
    (f) => meta.fields.includes(f) || (entry.dissolve ?? "").split(",").includes(f) || f === entry.sum,
  );
  if (keep.length) args.push("-filter-fields", keep.join(","));
  else args.push("-each", "delete this.properties");

  if (!HIGH_FIDELITY && meta.geometry !== "point" && p.percent !== "0%") {
    args.push("-simplify", p.percent ?? "2%", "keep-shapes");
  }

  const precision = HIGH_FIDELITY ? "0.00001" : (p.precision ?? 3) >= 3 ? "0.001" : "0.01";
  args.push("-o", target, "format=geojson", `precision=${precision}`);

  await exec("node", [MS, ...args], { maxBuffer: 512 * 1024 * 1024 });

  const raw = JSON.parse(await readFile(target, "utf8"));
  const features = (raw.features ?? []).filter((f) => f.geometry);
  const out = {
    type: "FeatureCollection",
    metadata: {
      preview: true,
      generalized: HIGH_FIDELITY
        ? "high-fidelity view preview (full detail, high-precision coordinates); source shapefile remains authoritative"
        : `coordinates rounded to ${p.precision ?? 3} decimals, geometry simplified`,
      source: "Preview artefact — not the deliverable dataset",
      catalogued: TODAY,
    },
    features,
  };
  await writeFile(target, JSON.stringify(out), "utf8");
  return { features: features.length, extent: extentOfFeatures(features) };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const datasets = [];
  const manifest = { generatedAt: new Date().toISOString(), layers: [] };

  for (const entry of CATALOG) {
    const file = path.join(SRC, entry.file);
    try {
      // Apply the entry's filter when counting so the catalog reports the
      // actual dataset size (e.g. Region VII only), not the whole source file.
      const meta = await info(file, entry.filter);
      if (!meta.geometry) throw new Error("no geometry");
      const { features, extent } = await makePreview(entry, meta);
      if (features === 0) throw new Error("preview has 0 features");

      const datasetCount = entry.count === "preview" ? features : meta.records;
      datasets.push(datasetFrom(entry, meta, features, extent));
      manifest.layers.push({
        slug: entry.slug,
        file: `/previews/${entry.slug}.geojson`,
        features,
        sourceFeatures: datasetCount,
        geometry: meta.geometry,
      });
      console.log(
        `  ✓ ${entry.slug.padEnd(34)} ${String(datasetCount).padStart(8)} src → ${String(features).padStart(5)} preview  ${meta.geometry}`,
      );
    } catch (error) {
      console.error(`  ✗ ${entry.slug.padEnd(34)} ${String(error.message ?? error).slice(0, 180)}`);
    }
  }

  datasets.sort((a, b) => a.title.en.localeCompare(b.title.en));
  await writeFile(OUT_JSON, JSON.stringify(datasets, null, 2), "utf8");
  await writeFile(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  console.log(`\n✓ ${datasets.length}/${CATALOG.length} datasets written to data/datasets.json`);
}

main().catch((error) => {
  console.error("✗ catalog build failed:", error);
  process.exit(1);
});

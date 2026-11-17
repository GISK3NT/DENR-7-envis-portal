export type Locale = "en" | "fil";

export type Bilingual = { en: string; fil: string };

export type GeometryType = "polygon" | "polyline" | "point";

export type CategoryId =
  | "admin-boundaries"
  | "land-forest"
  | "water"
  | "protected-areas"
  | "tenure"
  | "coastal"
  | "environment";

export type FieldDef = {
  name: string;
  alias: string;
  type: "string" | "integer" | "double" | "date";
  domain?: string[];
};

export type PreviewRef = {
  file: string;
  kind: "vector" | "raster";
  thumb?: string;
  note?: string;
};

export type Dataset = {
  id: string;
  slug: string;
  title: Bilingual;
  summary: Bilingual;
  description: Bilingual;
  category: CategoryId;
  tags: string[];
  publisher: string;
  steward: string;
  geometryType: GeometryType;
  featureCount: number | null;
  crs: string;
  extent: [number, number, number, number];
  preview: PreviewRef | null;
  fields: FieldDef[];
  source: {
    kind: "local" | "public-arcgis";
    reference: string;
    attribution: string;
  };
  isDemo: boolean;
  access: "request";
  updateFrequency: string;
  lastUpdated: string;
  license: { name: string; url?: string };
  citation: string;
  provinces: string[];
};

export type Category = {
  id: CategoryId;
  en: string;
  fil: string;
  blurb: Bilingual;
};

export type Province = {
  id: string;
  en: string;
  fil: string;
  code: string;
};

export type RequestStatus = "pending" | "approved" | "declined";

export type AccessRequest = {
  id: number;
  ref: string;
  dataset_slug: string;
  dataset_title: string;
  full_name: string;
  email: string;
  organization: string;
  position: string | null;
  purpose: string;
  intended_use: string;
  area_of_interest: string | null;
  attachment_name: string | null;
  attachment_path: string | null;
  status: RequestStatus;
  reviewer_id: number | null;
  reviewer_note: string | null;
  reviewed_at: string | null;
  reply_message: string | null;
  reply_attachment_name: string | null;
  reply_attachment_path: string | null;
  notified_at: string | null;
  notify_error: string | null;
  created_at: string;
};

export type AdminUser = {
  id: number;
  username: string | null;
  email: string;
  name: string;
  role: "admin" | "reviewer";
  created_at: string;
  last_login_at: string | null;
};

export type AuditEntry = {
  id: number;
  actor_email: string | null;
  action: string;
  target: string | null;
  detail: string | null;
  created_at: string;
};

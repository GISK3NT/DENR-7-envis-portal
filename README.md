<div align="center">
  <img src="public/brand/denr-logo.svg" alt="ENVIS DENR Region VII" width="160" height="160">
  <h1>ENVIS · DENR Region VII</h1>
  <p><strong>Environmental and Natural Resources Information System</strong><br>
  Central Visayas Geospatial Data Portal</p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js 15">
    <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript 5">
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css" alt="Tailwind CSS">
    <img src="https://img.shields.io/badge/MapLibre_GL-6-0096D6?logo=maplibre" alt="MapLibre GL 6">
    <img src="https://img.shields.io/badge/Node-sqlite-green?logo=sqlite" alt="Node sqlite">
    <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License">
  </p>
</div>

---

## Overview

**ENVIS** is the official geospatial data portal of the **Department of Environment and Natural Resources (DENR) Region VII — Central Visayas**. It serves as the authoritative gateway for discovering, previewing, and requesting access to the region's environmental and natural resources datasets.

The portal is built on a **showcase-only** architecture: visitors explore rich metadata, interactive map previews, and data dictionaries — then submit formal access requests. **Source shapefiles never leave DENR custody** and are never served by the application.

## Why This Matters

| Challenge | ENVIS Response |
|-----------|----------------|
| **Data sovereignty** — sensitive geospatial assets must remain under government control | Previews are lossy derivatives (reprojected to WGS 84, simplified to ~110 m precision, attribute-whitelisted). No download endpoints exist. |
| **Transparency with accountability** — the public has a right to know what data exists | 101 curated datasets across boundaries, land cover, watersheds, protected areas, tenure, coastal/marine, and environmental themes — each with full metadata and data dictionary. |
| **Controlled release** — access must be reviewed, logged, and auditable | Two-role review queue (Reviewer / Administrator) with immutable audit trail; every decision recorded with reviewer, timestamp, and note. |
| **Operational resilience** — must run on standard DENR workstations without cloud dependencies | Zero native dependencies; SQLite via Node's built-in `node:sqlite`; runs on any Node 24+ host. |
| **Inclusive access** — stakeholders across the region speak English and Filipino | Full bilingual interface (EN/FIL) with persisted locale preference. |
| **Interoperability** — external systems must be discoverable | Integrated public dashboard links: EMB Public Viewing, AQMS Public Advisories. |

## Key Capabilities

### Public Portal
- **Catalog browser** — filterable by category, province, geometry type; searchable by keyword
- **Dataset detail pages** — metadata, data dictionary, interactive MapLibre preview with basemap switcher (Light, Dark, Streets, Topo, Imagery — all keyless)
- **Access request workflow** — structured form with validation, optional supporting attachment, automatic bilingual acknowledgement email
- **Geohazard map viewer** — MGB landslide/flood susceptibility maps for all Central Visayas provinces

### Review Console (Staff Only)
- **Request queue** — sortable, filterable, paginated; real-time status badges
- **Request detail** — full applicant info, dataset context, attachment viewer (PDF/PNG/JPEG, magic-byte verified)
- **Decision actions** — Approve / Decline with custom note and optional release attachment (≤ 15 MB)
- **Automated bilingual decision emails** — sent via any free SMTP provider (Gmail, Yahoo, Outlook, Proton, custom)
- **Resend capability** — retry failed deliveries without re-review
- **Audit log** — immutable record of every auth event, decision, email send/failure, account change

### Security by Design
- **MapLibre GL JS 6** — critical XSS advisory (GHSA-jrc7-96c5-q579) resolved
- **Baseline security headers** — CSP, `nosniff`, `frame-ancestors 'none'`, referrer policy, permissions policy, COOP, conditional HSTS
- **Rate limiting** — login (8/15 min per identifier, 30/IP), requests (3/hr per email, 8/IP) — in-process with audit logging
- **Upload hardening** — extension + MIME + size + magic-byte verification (PDF/PNG/JPEG signatures)
- **Attachment serving** — containment via `path.relative`, filename sanitization, `Content-Disposition: attachment`, sandbox CSP
- **Session cookies** — `httpOnly`, `sameSite=lax`, `Secure` by default in production
- **No secrets in repo** — `.env*`, `shapefiles/`, `private_data/`, `data/*.sqlite*` all git-ignored

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      PUBLIC PORTAL                          │
│  /datasets   /datasets/[slug]   /request/[slug]              │
│  /geohazards-maps   /lcm-analysis   /about                   │
└────────────────────────────┬────────────────────────────────┘
                             │ Server Actions (same-origin)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     REVIEW CONSOLE                          │
│  /admin (auth)   /admin/requests   /admin/requests/[id]     │
│  /admin/users    /admin/audit                                 │
└────────────────────────────┬────────────────────────────────┘
                             │ Repository Layer
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA STORES                            │
│  data/envis.sqlite   (requests, users, sessions, audit)    │
│  public/previews/    (lossy GeoJSON previews — web served)  │
│  private_data/outbox/ (release attachments — never web)     │
│  shapefiles/         (source data — build-time only)        │
└─────────────────────────────────────────────────────────────┘
```

**Technology Stack**
- **Framework**: Next.js 15 (App Router, Server Actions)
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 3.4, custom design system
- **Mapping**: MapLibre GL JS 6 (ESM), 5 keyless basemaps
- **Database**: Node `node:sqlite` (WAL mode, prepared statements)
- **Email**: Nodemailer with provider presets + custom SMTP
- **Build tooling**: mapshaper (dev), ESLint, Prettier

## Dataset Coverage (101 Layers)

| Category | Examples |
|----------|----------|
| **Boundaries** | Provincial, municipal, barangay (PSA/NAMRIA official) |
| **Land Cover** | NAMRIA 2015/2020 classifications, forest/non-forest |
| **Watersheds** | Critical watersheds, river basins, sub-basins |
| **Protected Areas** | NIPAS, locally declared, KBAs, marine sanctuaries |
| **Tenure** | CADT/CALT, CBFMA, IFMA, SAGF, FLAgT (attributes whitelisted) |
| **Coastal/Marine** | Mangroves, seagrass, coral reefs, bathymetry-derived |
| **Environmental** | MGB geohazards (landslide/flood), air quality stations, ECAN zones |
| **Climate** | LCCAP vulnerability, rainfall, temperature projections |

All previews generated via reproducible `npm run catalog` pipeline from authoritative source shapefiles.

## Governance & Compliance

- **Data Privacy Act (RA 10173)** — requester personal data stored only in SQLite with restricted ACLs; never exposed publicly
- **Open Data Principles** — metadata discoverable; access granted through transparent, logged process
- **DENR Memorandum Circulars** — aligns with geospatial data sharing and access control directives
- **Audit Trail** — every action traceable to authenticated staff account with timestamp

## For DENR IT Administrators

This repository contains **application source code only**. Deployment artifacts excluded by `.gitignore`:

| Excluded Path | Reason |
|---------------|--------|
| `shapefiles/` | 101 source layers — PII, proprietary, build-time only |
| `private_data/` | Release attachments, outbox — never web-accessible |
| `data/*.sqlite*` | Request queue, accounts, audit — contains personal data |
| `.env*` | SMTP credentials, DB path, HTTPS flag — per-environment |

**Required environment variables** (documented in `.env.example`):
- `ENVIS_DB` — SQLite path (default `data/envis.sqlite`)
- `ENVIS_ADMIN_*` — initial admin account (username, email, name, password)
- `ENVIS_HTTPS` — set `1` when served over TLS (enables HSTS + Secure cookies)
- `ENVIS_MAIL_PROVIDER` + `ENVIS_SMTP_*` — outbound email configuration
- `ENVIS_GEOHAZARD_DIR` — optional external path for public geohazard JPEGs

## Visual Identity

The ENVIS mark combines the **DENR shield** with three environmental pillars:
- **Mountain** — terrestrial ecosystems, watersheds, protected areas
- **Three leaves** — forest cover, biodiversity, land cover classification
- **Waves** — coastal/marine resources, Central Visayas archipelagic character
- **Three stars** — Luzon, Visayas, Mindanao; Region VII at the heart of the Visayas

Color palette: **Forest Green** (`#14352A`) for environmental mandate, **Brass Gold** (`#B08D57`) for government authority, **Sand/Ink** neutrals for clarity and accessibility.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <p><strong>Department of Environment and Natural Resources</strong><br>
  Regional Office VII — Central Visayas<br>
  Sudlon, Lahug, Cebu City 6000, Philippines</p>
  <p><em>Protecting our environment, empowering our communities.</em></p>
</div>
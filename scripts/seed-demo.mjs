/**
 * seed-demo.mjs
 * ----------------------------------------------------------------------------
 * Inserts a few realistic requests so the review console can be demonstrated.
 * Idempotent: rows are keyed by reference number.
 *
 *   npm run seed:demo     add the sample requests
 *   npm run seed:demo -- --clear   remove them again
 */
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const DB_PATH = process.env.ENVIS_DB ?? path.join(process.cwd(), "data", "envis.sqlite");
const db = new DatabaseSync(DB_PATH);
const clear = process.argv.includes("--clear");

const samples = [
  {
    ref: "ENVIS-R7-2026-0001",
    dataset_slug: "landcover-2025-r7",
    dataset_title: "Land Cover 2025 – Region VII",
    full_name: "Maria Santos",
    email: "maria.santos@gmail.com",
    organization: "Cebu Provincial Planning and Development Office",
    position: "GIS Officer",
    purpose:
      "We are updating the provincial forest cover baseline for the 2026 Comprehensive Land Use Plan.",
    intended_use:
      "A provincial forest cover map and area statistics table to support the CLUP update and the local climate action plan.",
    area_of_interest: "Cebu Province",
    status: "pending",
  },
  {
    ref: "ENVIS-R7-2026-0002",
    dataset_slug: "protected-areas-r7",
    dataset_title: "Protected Areas",
    full_name: "Dr. Elena Reyes",
    email: "e.reyes@yahoo.com",
    organization: "Bohol University — Environmental Science Institute",
    position: "Associate Professor",
    purpose:
      "Graduate research on forest fragmentation inside Rajah Sikatuna and the Chocolate Hills complex.",
    intended_use:
      "Analysis inputs for a peer-reviewed paper and a policy brief for the Bohol Provincial Environment Office.",
    area_of_interest: "Bohol",
    status: "approved",
    reviewer_note: "Research use, attribution accepted. Delivered via the regional file server.",
  },
  {
    ref: "ENVIS-R7-2026-0003",
    dataset_slug: "tenurial-cbfma-r7",
    dataset_title: "Community-Based Forest Management Agreements (CBFMA) – Region VII",
    full_name: "Jose Dela Cruz",
    email: "jdelacruz@outlook.com",
    organization: "Negros Oriental Provincial Environment and Natural Resources Office",
    position: "Forestry Technician",
    purpose:
      "Cross-checking CBFM agreement boundaries against our 2026 monitoring itinerary for tenured sites.",
    intended_use: "Internal validation sheets and field maps for the quarterly CBFM monitoring visits.",
    area_of_interest: "Negros Oriental",
    status: "pending",
  },
];

if (clear) {
  const stmt = db.prepare("DELETE FROM requests WHERE ref = ?");
  for (const sample of samples) stmt.run(sample.ref);
  db.prepare("DELETE FROM audit_log WHERE target IN (?, ?, ?)").run(...samples.map((s) => s.ref));
  console.log(`✓ Removed ${samples.length} demo requests.`);
  process.exit(0);
}

const reviewer = db
  .prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1")
  .get();

const insert = db.prepare(
  `INSERT OR IGNORE INTO requests
     (ref, dataset_slug, dataset_title, full_name, email, organization, position,
      purpose, intended_use, area_of_interest, status, reviewer_id, reviewer_note, reviewed_at, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);

const audit = db.prepare(
  "INSERT INTO audit_log (actor_id, actor_email, action, target, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)",
);

let added = 0;
for (const [index, sample] of samples.entries()) {
  const created = new Date(Date.now() - (index + 1) * 36e5 * 26).toISOString();
  const reviewed = sample.status === "pending" ? null : new Date(Date.now() - index * 36e5 * 6).toISOString();
  const before = db.prepare("SELECT COUNT(*) AS c FROM requests").get().c;
  insert.run(
    sample.ref,
    sample.dataset_slug,
    sample.dataset_title,
    sample.full_name,
    sample.email,
    sample.organization,
    sample.position,
    sample.purpose,
    sample.intended_use,
    sample.area_of_interest,
    sample.status,
    sample.status === "pending" ? null : (reviewer?.id ?? null),
    sample.reviewer_note ?? null,
    reviewed,
    created,
  );
  const after = db.prepare("SELECT COUNT(*) AS c FROM requests").get().c;
  if (after > before) {
    added++;
    audit.run(
      null,
      sample.email,
      "request.submitted",
      sample.ref,
      `dataset=${sample.dataset_slug}`,
      created,
    );
    if (sample.status !== "pending") {
      audit.run(
        reviewer?.id ?? null,
        reviewer ? "geocheckcentralvisayas@gmail.com" : null,
        `request.${sample.status}`,
        sample.ref,
        `dataset=${sample.dataset_slug}${sample.reviewer_note ? `; note=${sample.reviewer_note}` : ""}`,
        reviewed,
      );
    }
  }
}

console.log(`✓ ${added} demo request(s) added (${samples.length - added} already present).`);
console.log("  Explore them at /admin/requests");
console.log("  Remove them with: npm run seed:demo -- --clear");

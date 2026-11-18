/**
 * seed-admin.mjs
 * ----------------------------------------------------------------------------
 * Creates the first staff account. Run once after cloning.
 *
 *   ENVIS_ADMIN_USERNAME=envisadmin ENVIS_ADMIN_PASSWORD=... npm run seed
 *
 * With no env vars it creates username `envisadmin` and a default password
 * that must be changed before the console is exposed beyond the LAN.
 */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const STORAGE_ROOT = process.env.ENVIS_STORAGE_ROOT ?? process.cwd();
const DB_PATH = process.env.ENVIS_DB ?? path.join(STORAGE_ROOT, "data", "envis.sqlite");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'reviewer')),
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_login_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref TEXT NOT NULL UNIQUE,
  dataset_slug TEXT NOT NULL,
  dataset_title TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT NOT NULL,
  position TEXT,
  purpose TEXT NOT NULL,
  intended_use TEXT NOT NULL,
  area_of_interest TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  reviewer_id INTEGER,
  reviewer_note TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (reviewer_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(created_at);
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id INTEGER,
  actor_email TEXT,
  action TEXT NOT NULL,
  target TEXT,
  detail TEXT,
  created_at TEXT NOT NULL
);
`;

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

const email = (process.env.ENVIS_ADMIN_EMAIL ?? "geocheckcentralvisayas@gmail.com").toLowerCase().trim();
const username = (process.env.ENVIS_ADMIN_USERNAME ?? "envisadmin").toLowerCase().trim();
const name = process.env.ENVIS_ADMIN_NAME ?? "ENVIS Administrator";
const shouldUpdate = process.argv.includes("--update");

// Require an explicit password; no default fallback. Generate a strong one
// if the user passes --generate (useful for CI/CD), otherwise fail fast.
let password = process.env.ENVIS_ADMIN_PASSWORD;
let generated = false;
if (!password) {
  if (process.argv.includes("--generate")) {
    // 256-bit entropy, URL-safe base64
    password = crypto.randomBytes(32).toString("base64url");
    generated = true;
  } else {
    console.error("✗ ENVIS_ADMIN_PASSWORD is required. Set it in the environment, or pass --generate to create a random one.");
    process.exit(1);
  }
}

if (password.length < 10) {
  console.error("✗ ENVIS_ADMIN_PASSWORD must be at least 10 characters.");
  process.exit(1);
}
if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) {
  console.error("✗ ENVIS_ADMIN_USERNAME must be 3–32 characters: letters, numbers, dots, dashes, or underscores.");
  process.exit(1);
}

mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");
db.exec(SCHEMA);

// Existing databases predate the username column.
try {
  const cols = db.prepare("PRAGMA table_info(users)").all();
  if (!cols.some((c) => c.name === "username")) db.exec("ALTER TABLE users ADD COLUMN username TEXT");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)");
} catch {
  // ignore
}

const existing = db
  .prepare("SELECT id, email, username FROM users WHERE lower(email) = ? OR lower(username) = ?")
  .get(email, username);

if (existing) {
  if (!shouldUpdate) {
    console.log(`• An account already exists (id ${existing.id}). Re-run with --update to rotate its credentials.`);
    process.exit(0);
  }
  db.prepare("UPDATE users SET username = ?, email = ?, name = ?, role = 'admin', password_hash = ? WHERE id = ?").run(
    username,
    email,
    name,
    hashPassword(password),
    existing.id,
  );
  db.prepare("INSERT INTO audit_log (actor_email, action, target, detail, created_at) VALUES (?, ?, ?, ?, ?)").run(
    email,
    "user.credentials_updated",
    email,
    "administrator credentials rotated by seed script",
    new Date().toISOString(),
  );
  console.log("✓ Administrator account updated");
  console.log(`  username: ${username}`);
  console.log(`  email:    ${email}`);
  if (generated) console.log(`  password: ${password}   (generated — store securely)`);
  console.log(`  database: ${DB_PATH}`);
  process.exit(0);
}

db.prepare(
  "INSERT INTO users (username, email, name, role, password_hash, created_at) VALUES (?, ?, ?, 'admin', ?, ?)",
).run(username, email, name, hashPassword(password), new Date().toISOString());

db.prepare("INSERT INTO audit_log (actor_email, action, target, detail, created_at) VALUES (?, ?, ?, ?, ?)").run(
  email,
  "user.seeded",
  email,
  "initial administrator",
  new Date().toISOString(),
);

console.log("✓ Administrator account created");
console.log(`  username: ${username}`);
console.log(`  email:    ${email}`);
if (generated) console.log(`  password: ${password}   (generated — store securely)`);
console.log(`  database: ${DB_PATH}`);

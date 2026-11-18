import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { storagePath } from "./storage";

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
  attachment_name TEXT,
  attachment_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  reviewer_id INTEGER,
  reviewer_note TEXT,
  reviewed_at TEXT,
  reply_message TEXT,
  reply_attachment_name TEXT,
  reply_attachment_path TEXT,
  notified_at TEXT,
  notify_error TEXT,
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

function resolveDbPath(): string {
  return process.env.ENVIS_DB ?? storagePath("data", "envis.sqlite");
}

declare global {
  // eslint-disable-next-line no-var
  var __envisDb: DatabaseSync | undefined;
}

/**
 * Single lazily-opened SQLite connection shared across the process.
 * Using Node's built-in node:sqlite keeps the app free of native dependencies,
 * which matters for a portal that must run on a DENR workstation.
 */
export function db(): DatabaseSync {
  if (globalThis.__envisDb) return globalThis.__envisDb;

  const file = resolveDbPath();
  mkdirSync(path.dirname(file), { recursive: true });

  const database = new DatabaseSync(file);
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec("PRAGMA foreign_keys = ON;");
  database.exec(SCHEMA);

  // lightweight migrations for existing databases
  try {
    const cols = database.prepare("PRAGMA table_info(requests)").all() as { name: string }[];
    const names = new Set(cols.map((c) => c.name));
    if (!names.has("attachment_name")) database.exec("ALTER TABLE requests ADD COLUMN attachment_name TEXT");
    if (!names.has("attachment_path")) database.exec("ALTER TABLE requests ADD COLUMN attachment_path TEXT");
    if (!names.has("reply_message")) database.exec("ALTER TABLE requests ADD COLUMN reply_message TEXT");
    if (!names.has("reply_attachment_name"))
      database.exec("ALTER TABLE requests ADD COLUMN reply_attachment_name TEXT");
    if (!names.has("reply_attachment_path"))
      database.exec("ALTER TABLE requests ADD COLUMN reply_attachment_path TEXT");
    if (!names.has("notified_at")) database.exec("ALTER TABLE requests ADD COLUMN notified_at TEXT");
    if (!names.has("notify_error")) database.exec("ALTER TABLE requests ADD COLUMN notify_error TEXT");
  } catch {
    // ignore if table not ready
  }

  try {
    const cols = database.prepare("PRAGMA table_info(users)").all() as { name: string }[];
    if (!cols.some((c) => c.name === "username")) database.exec("ALTER TABLE users ADD COLUMN username TEXT");
    database.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)");
  } catch {
    // ignore if table not ready
  }

  globalThis.__envisDb = database;
  return database;
}

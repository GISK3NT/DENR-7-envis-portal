import { db } from "@/lib/db";
import type { AccessRequest, AdminUser, AuditEntry, RequestStatus } from "@/lib/types";

/* ------------------------------------------------------------- requests */

export type NewAccessRequest = {
  dataset_slug: string;
  dataset_title: string;
  full_name: string;
  email: string;
  organization: string;
  position?: string | null;
  purpose: string;
  intended_use: string;
  area_of_interest?: string | null;
  attachment_name?: string | null;
  attachment_path?: string | null;
};

function nextReference(): string {
  const year = new Date().getFullYear();
  const prefix = `ENVIS-R7-${year}-`;
  const row = db()
    .prepare("SELECT ref FROM requests WHERE ref LIKE ? ORDER BY id DESC LIMIT 1")
    .get(`${prefix}%`) as { ref: string } | undefined;
  const last = row ? Number.parseInt(row.ref.slice(prefix.length), 10) : 0;
  return `${prefix}${String((Number.isNaN(last) ? 0 : last) + 1).padStart(4, "0")}`;
}

export function createAccessRequest(input: NewAccessRequest): AccessRequest {
  const now = new Date().toISOString();
  const ref = nextReference();
  const result = db()
    .prepare(
      `INSERT INTO requests
         (ref, dataset_slug, dataset_title, full_name, email, organization, position,
          purpose, intended_use, area_of_interest, attachment_name, attachment_path, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    )
    .run(
      ref,
      input.dataset_slug,
      input.dataset_title,
      input.full_name.trim(),
      input.email.trim().toLowerCase(),
      input.organization.trim(),
      input.position?.trim() || null,
      input.purpose.trim(),
      input.intended_use.trim(),
      input.area_of_interest?.trim() || null,
      input.attachment_name?.trim() || null,
      input.attachment_path || null,
      now,
    );

  return getAccessRequest(Number(result.lastInsertRowid))!;
}

export function getAccessRequest(id: number): AccessRequest | undefined {
  return db().prepare("SELECT * FROM requests WHERE id = ?").get(id) as AccessRequest | undefined;
}

export function getAccessRequestByRef(ref: string): AccessRequest | undefined {
  return db().prepare("SELECT * FROM requests WHERE ref = ?").get(ref) as AccessRequest | undefined;
}

export function listAccessRequests(options: { status?: RequestStatus | "all"; q?: string } = {}): AccessRequest[] {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (options.status && options.status !== "all") {
    clauses.push("status = ?");
    params.push(options.status);
  }
  const q = options.q?.trim();
  if (q) {
    clauses.push("(ref LIKE ? OR full_name LIKE ? OR email LIKE ? OR organization LIKE ? OR dataset_title LIKE ?)");
    const like = `%${q}%`;
    params.push(like, like, like, like, like);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return db()
    .prepare(
      `SELECT * FROM requests ${where}
       ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, created_at DESC`,
    )
    .all(...params) as AccessRequest[];
}

export function reviewAccessRequest(input: {
  id: number;
  reviewerId: number;
  status: "approved" | "declined";
  note?: string | null;
  replyMessage?: string | null;
  replyAttachmentName?: string | null;
  replyAttachmentPath?: string | null;
}): void {
  db()
    .prepare(
      `UPDATE requests
          SET status = ?, reviewer_id = ?, reviewer_note = ?, reviewed_at = ?,
              reply_message = ?, reply_attachment_name = ?, reply_attachment_path = ?
        WHERE id = ?`,
    )
    .run(
      input.status,
      input.reviewerId,
      input.note?.trim() || null,
      new Date().toISOString(),
      input.replyMessage?.trim() || null,
      input.replyAttachmentName?.trim() || null,
      input.replyAttachmentPath || null,
      input.id,
    );
}

export function markRequestNotified(id: number, error?: string | null): void {
  db()
    .prepare("UPDATE requests SET notified_at = ?, notify_error = ? WHERE id = ?")
    .run(error ? null : new Date().toISOString(), error ?? null, id);
}

export function requestStats(): Record<RequestStatus | "total", number> {
  const rows = db().prepare("SELECT status, COUNT(*) AS c FROM requests GROUP BY status").all() as {
    status: RequestStatus;
    c: number;
  }[];
  const base: Record<RequestStatus | "total", number> = {
    pending: 0,
    approved: 0,
    declined: 0,
    total: 0,
  };
  for (const row of rows) {
    base[row.status] = Number(row.c);
    base.total += Number(row.c);
  }
  return base;
}

export function requestsByDataset(limit = 5): { dataset_title: string; c: number }[] {
  return db()
    .prepare(
      `SELECT dataset_title, COUNT(*) AS c FROM requests
        GROUP BY dataset_slug ORDER BY c DESC LIMIT ?`,
    )
    .all(limit) as { dataset_title: string; c: number }[];
}

/* ---------------------------------------------------------------- users */

export function listUsers(): AdminUser[] {
  return db()
    .prepare("SELECT id, username, email, name, role, created_at, last_login_at FROM users ORDER BY name")
    .all() as AdminUser[];
}

export function getUserById(id: number): AdminUser | undefined {
  return db()
    .prepare("SELECT id, username, email, name, role, created_at, last_login_at FROM users WHERE id = ?")
    .get(id) as AdminUser | undefined;
}

export function countUsers(): number {
  const row = db().prepare("SELECT COUNT(*) AS c FROM users").get() as { c: number };
  return Number(row.c);
}

export function createUser(input: {
  username?: string | null;
  email: string;
  name: string;
  role: "admin" | "reviewer";
  passwordHash: string;
}): number {
  const result = db()
    .prepare(
      "INSERT INTO users (username, email, name, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(
      input.username?.trim().toLowerCase() || null,
      input.email.trim().toLowerCase(),
      input.name.trim(),
      input.role,
      input.passwordHash,
      new Date().toISOString(),
    );
  return Number(result.lastInsertRowid);
}

export function updateUserRole(id: number, role: "admin" | "reviewer"): void {
  db().prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
}

export function deleteUser(id: number): void {
  db().prepare("DELETE FROM users WHERE id = ?").run(id);
}

export function countAdmins(): number {
  const row = db().prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'").get() as { c: number };
  return Number(row.c);
}

/* ------------------------------------------------------------ audit log */

export function writeAudit(entry: {
  actorId?: number | null;
  actorEmail?: string | null;
  action: string;
  target?: string | null;
  detail?: string | null;
}): void {
  db()
    .prepare(
      "INSERT INTO audit_log (actor_id, actor_email, action, target, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(
      entry.actorId ?? null,
      entry.actorEmail ?? null,
      entry.action,
      entry.target ?? null,
      entry.detail ?? null,
      new Date().toISOString(),
    );
}

export function listAudit(limit = 100): AuditEntry[] {
  return db()
    .prepare("SELECT id, actor_email, action, target, detail, created_at FROM audit_log ORDER BY id DESC LIMIT ?")
    .all(limit) as AuditEntry[];
}

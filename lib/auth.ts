import crypto from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { AdminUser } from "@/lib/types";

export const SESSION_COOKIE = "envis_session";
const SESSION_DAYS = 7;

/** Upper bound for password input; keeps scrypt from being used as a DoS. */
export const MAX_PASSWORD_LENGTH = 200;
export const MAX_IDENTIFIER_LENGTH = 200;

/* ------------------------------------------------------------- passwords */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  if (expected.length !== 64) return false;
  const actual = crypto.scryptSync(password, salt, expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

/**
 * Constant-work password check for unknown accounts. Without this, a missing
 * user returns much faster than a wrong password, which leaks which usernames
 * exist.
 */
const DUMMY_HASH = `scrypt:${"00".repeat(16)}:${"00".repeat(64)}`;
export function burnPasswordCheck(password: string): void {
  verifyPassword(password, DUMMY_HASH);
}


/* -------------------------------------------------------------- sessions */

type UserRow = {
  id: number;
  username: string | null;
  email: string;
  name: string;
  role: "admin" | "reviewer";
  password_hash: string;
  created_at: string;
  last_login_at: string | null;
};

export function findUserByEmail(email: string): UserRow | undefined {
  return db()
    .prepare("SELECT * FROM users WHERE lower(email) = lower(?)")
    .get(email.trim()) as UserRow | undefined;
}

/** Staff can sign in with either their username or their email address. */
export function findUserByIdentifier(identifier: string): UserRow | undefined {
  const value = identifier.trim();
  if (!value) return undefined;
  return db()
    .prepare(
      `SELECT * FROM users
        WHERE lower(email) = lower(?) OR lower(username) = lower(?)
        ORDER BY CASE WHEN lower(username) = lower(?) THEN 0 ELSE 1 END
        LIMIT 1`,
    )
    .get(value, value, value) as UserRow | undefined;
}

export function findUserByUsername(username: string): UserRow | undefined {
  return db()
    .prepare("SELECT * FROM users WHERE lower(username) = lower(?)")
    .get(username.trim()) as UserRow | undefined;
}

export function createSession(userId: number): { id: string; expiresAt: string } {
  const id = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  db()
    .prepare("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .run(id, userId, now.toISOString(), expires.toISOString());
  db().prepare("UPDATE users SET last_login_at = ? WHERE id = ?").run(now.toISOString(), userId);
  return { id, expiresAt: expires.toISOString() };
}

export function deleteSession(id: string): void {
  db().prepare("DELETE FROM sessions WHERE id = ?").run(id);
}

export function purgeExpiredSessions(): void {
  db().prepare("DELETE FROM sessions WHERE expires_at < ?").run(new Date().toISOString());
}

export async function getCurrentUser(): Promise<AdminUser | undefined> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return undefined;

  const row = db()
    .prepare(
      `SELECT u.id, u.username, u.email, u.name, u.role, u.created_at, u.last_login_at
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.id = ? AND s.expires_at > ?`,
    )
    .get(token, new Date().toISOString()) as AdminUser | undefined;

  return row;
}

export async function setSessionCookie(token: string, expiresAt: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // Secure by default in production. Set ENVIS_HTTPS=0 only for a plain
    // HTTP LAN deployment; localhost is treated as secure by browsers.
    secure: process.env.NODE_ENV === "production" ? process.env.ENVIS_HTTPS !== "0" : false,
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

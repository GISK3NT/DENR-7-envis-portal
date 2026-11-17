"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  MAX_IDENTIFIER_LENGTH,
  MAX_PASSWORD_LENGTH,
  SESSION_COOKIE,
  burnPasswordCheck,
  clearSessionCookie,
  createSession,
  deleteSession,
  findUserByEmail,
  findUserByIdentifier,
  findUserByUsername,
  getCurrentUser,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { checkLimit, clearLimit, clientIp, recordHit } from "@/lib/rate-limit";
import {
  countAdmins,
  createUser,
  deleteUser,
  getAccessRequest,
  markRequestNotified,
  reviewAccessRequest,
  updateUserRole,
  writeAudit,
} from "@/lib/repo";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import { decisionEmail } from "@/lib/mail-templates";

/* ---------------------------------------------------------------- login */

export type LoginState = { error?: string };

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_ATTEMPTS_PER_IDENTIFIER = 8;
const LOGIN_ATTEMPTS_PER_IP = 30;
const THROTTLE_MESSAGE = "Too many sign-in attempts. Wait 15 minutes, then try again.";

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const identifier = String(formData.get("identifier") ?? formData.get("email") ?? "")
    .trim()
    .slice(0, MAX_IDENTIFIER_LENGTH);
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: "Enter your username or email address and password." };
  }
  // Refuse oversized input instead of feeding it to scrypt.
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { error: "Invalid username, email address, or password." };
  }

  const requestHeaders = await headers();
  const ip = clientIp(requestHeaders);
  const identifierKey = `login:id:${identifier.toLowerCase()}`;
  const ipKey = `login:ip:${ip}`;

  if (checkLimit(identifierKey, LOGIN_ATTEMPTS_PER_IDENTIFIER).blocked || checkLimit(ipKey, LOGIN_ATTEMPTS_PER_IP).blocked) {
    writeAudit({
      actorEmail: identifier,
      action: "auth.login_throttled",
      target: identifier,
      detail: `ip=${ip}`,
    });
    return { error: THROTTLE_MESSAGE };
  }

  const user = findUserByIdentifier(identifier);

  // Always do one scrypt comparison so response time does not reveal whether
  // the account exists.
  const passwordOk = user ? verifyPassword(password, user.password_hash) : (burnPasswordCheck(password), false);

  if (!user || !passwordOk) {
    recordHit(identifierKey, LOGIN_WINDOW_MS);
    recordHit(ipKey, LOGIN_WINDOW_MS);
    writeAudit({
      actorEmail: identifier,
      action: "auth.login_failed",
      target: identifier,
      detail: `ip=${ip}`,
    });
    return { error: "Invalid username, email address, or password." };
  }

  clearLimit(identifierKey);
  const session = createSession(user.id);
  await setSessionCookie(session.id, session.expiresAt);
  writeAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "auth.login",
    target: user.email,
    detail: `ip=${ip}`,
  });

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) deleteSession(token);
  await clearSessionCookie();
  redirect("/admin/login");
}

/* --------------------------------------------------------------- review */

const REPLY_MAX_BYTES = 15 * 1024 * 1024; // 15 MB
const REPLY_EXTENSIONS = new Set([
  ".pdf",
  ".zip",
  ".7z",
  ".jpg",
  ".jpeg",
  ".png",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
  ".txt",
  ".shp",
  ".geojson",
  ".gpkg",
  ".kml",
  ".kmz",
]);

function replyExtension(name: string): string {
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")).toLowerCase() : "";
  return REPLY_EXTENSIONS.has(ext) ? ext : "";
}

async function readOutgoingAttachment(
  formData: FormData,
): Promise<{ name: string; relativePath: string; bytes: Buffer } | { error: string } | null> {
  const file = formData.get("reply_attachment");
  if (!file || !(file instanceof File) || file.size === 0) return null;

  const ext = replyExtension(file.name || "");
  if (!ext) {
    return { error: "The reply attachment type is not allowed. Use PDF, ZIP, image, Office, CSV, or GIS files." };
  }
  if (file.size > REPLY_MAX_BYTES) {
    return { error: "The reply attachment is larger than 15 MB. Send a download link instead." };
  }

  const dir = path.join(process.cwd(), "private_data", "outbox");
  await mkdir(dir, { recursive: true });
  const filename = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);

  // Only the display name is kept; strip path parts and control characters so
  // it cannot influence the stored path or the outgoing mail headers.
  const displayName =
    path
      .basename(file.name || filename)
      .replace(/[\u0000-\u001f\u007f"\\/]/g, "")
      .trim()
      .slice(0, 150) || filename;

  return {
    name: displayName,
    relativePath: path.join("private_data", "outbox", filename),
    bytes,
  };
}

/** Sends the decision email for a reviewed request and records the outcome. */
async function deliverDecision(
  request: {
    id: number;
    ref: string;
    full_name: string;
    email: string;
    dataset_title: string;
    status: string;
    reviewer_note: string | null;
    reply_message: string | null;
    reply_attachment_name: string | null;
    reply_attachment_path: string | null;
  },
  actor: { id: number; email: string },
  attachment?: { name: string; bytes: Buffer } | null,
): Promise<void> {
  if (!isMailConfigured()) {
    markRequestNotified(request.id, "Outbound email is not configured. Add SMTP credentials to the environment file.");
    writeAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "email.skipped",
      target: request.ref,
      detail: "SMTP not configured",
    });
    return;
  }

  const content = decisionEmail({
    ref: request.ref,
    fullName: request.full_name,
    datasetTitle: request.dataset_title,
    status: request.status === "approved" ? "approved" : "declined",
    reviewerNote: request.reviewer_note,
    customMessage: request.reply_message,
    hasAttachment: Boolean(attachment),
  });

  try {
    await sendMail({
      to: request.email,
      subject: content.subject,
      text: content.text,
      html: content.html,
      attachments: attachment
        ? [{ filename: attachment.name, content: attachment.bytes }]
        : undefined,
    });
    markRequestNotified(request.id);
    writeAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "email.sent",
      target: request.ref,
      detail: `to=${request.email}; status=${request.status}${attachment ? "; attachment=1" : ""}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown SMTP error";
    markRequestNotified(request.id, message.slice(0, 500));
    writeAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "email.failed",
      target: request.ref,
      detail: message.slice(0, 300),
    });
  }
}

export async function reviewRequestAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const id = Number(formData.get("id"));
  const status = String(formData.get("status"));
  const note = String(formData.get("note") ?? "").slice(0, 2000);
  const reply = String(formData.get("reply") ?? "").slice(0, 4000);

  if (!Number.isFinite(id) || (status !== "approved" && status !== "declined")) {
    return;
  }

  const request = getAccessRequest(id);
  if (!request) return;

  const outgoing = await readOutgoingAttachment(formData);
  const attachment = outgoing && "bytes" in outgoing ? outgoing : null;
  const preflightError = outgoing && "error" in outgoing ? outgoing.error : null;

  reviewAccessRequest({
    id,
    reviewerId: user.id,
    status,
    note,
    replyMessage: reply,
    replyAttachmentName: attachment?.name ?? null,
    replyAttachmentPath: attachment?.relativePath ?? null,
  });
  writeAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: `request.${status}`,
    target: request.ref,
    detail: `dataset=${request.dataset_slug}${note ? `; note=${note.slice(0, 200)}` : ""}`,
  });

  if (preflightError) {
    markRequestNotified(id, preflightError);
    writeAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "email.failed",
      target: request.ref,
      detail: preflightError,
    });
  } else {
    const updated = getAccessRequest(id)!;
    await deliverDecision(updated, user, attachment);
  }

  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${id}`);
  revalidatePath("/admin");
}

/**
 * The decision buttons use one server action each. We cannot rely on the
 * submitter button's name/value: React's form-action submission omits it, which
 * made a single action with `status` silently receive nothing.
 */
async function reviewWith(formData: FormData, status: "approved" | "declined"): Promise<void> {
  formData.set("status", status);
  await reviewRequestAction(formData);
}

export async function approveRequestAction(formData: FormData): Promise<void> {
  await reviewWith(formData, "approved");
}

export async function declineRequestAction(formData: FormData): Promise<void> {
  await reviewWith(formData, "declined");
}

export async function resendDecisionEmailAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;

  const request = getAccessRequest(id);
  if (!request || request.status === "pending") return;

  let attachment: { name: string; bytes: Buffer } | null = null;
  if (request.reply_attachment_path && request.reply_attachment_name) {
    try {
      const { readFile } = await import("node:fs/promises");
      const bytes = await readFile(path.join(process.cwd(), request.reply_attachment_path));
      attachment = { name: request.reply_attachment_name, bytes };
    } catch {
      attachment = null;
    }
  }

  await deliverDecision(request, user, attachment);
  revalidatePath(`/admin/requests/${id}`);
  revalidatePath("/admin/requests");
}

/* ---------------------------------------------------------------- users */

export type UserFormState = { error?: string; ok?: boolean };

export async function createUserAction(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const actor = await getCurrentUser();
  if (!actor || actor.role !== "admin") {
    return { error: "Only administrators can add accounts." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "reviewer");

  if (name.length < 2) return { error: "Enter the staff member's name." };
  if (username && !/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) {
    return { error: "Username must be 3–32 characters: letters, numbers, dots, dashes, or underscores." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 10) return { error: "Use a password of at least 10 characters." };
  if (role !== "admin" && role !== "reviewer") return { error: "Invalid role." };

  if (findUserByEmail(email)) return { error: "An account with that email already exists." };
  if (username && findUserByUsername(username)) return { error: "That username is already taken." };

  createUser({ username: username || null, email, name, role, passwordHash: hashPassword(password) });
  writeAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "user.created",
    target: username ? `${username} <${email}>` : email,
    detail: `role=${role}`,
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function changeRoleAction(formData: FormData): Promise<void> {
  const actor = await getCurrentUser();
  if (!actor || actor.role !== "admin") return;

  const id = Number(formData.get("id"));
  const role = String(formData.get("role"));
  if (!Number.isFinite(id) || (role !== "admin" && role !== "reviewer")) return;
  if (id === actor.id) return;

  updateUserRole(id, role);
  writeAudit({ actorId: actor.id, actorEmail: actor.email, action: "user.role_changed", target: String(id), detail: role });
  revalidatePath("/admin/users");
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const actor = await getCurrentUser();
  if (!actor || actor.role !== "admin") return;

  const id = Number(formData.get("id"));
  if (!Number.isFinite(id) || id === actor.id) return;
  if (countAdmins() <= 1) return;

  deleteUser(id);
  writeAudit({ actorId: actor.id, actorEmail: actor.email, action: "user.deleted", target: String(id) });
  revalidatePath("/admin/users");
}

"use server";

import { mkdir, writeFile } from "node:fs/promises";
import { headers } from "next/headers";
import path from "node:path";
import { getDataset } from "@/lib/datasets";
import { createAccessRequest, markRequestNotified, writeAudit } from "@/lib/repo";
import { formatDateTime } from "@/lib/format";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import { acknowledgementEmail } from "@/lib/mail-templates";
import { checkLimit, clientIp, recordHit } from "@/lib/rate-limit";
import {
  attachmentContentMatchesType,
  readAttachment,
  readRequestValues,
  validateRequest,
  type AttachmentErrorCode,
  type FieldErrorCode,
} from "@/lib/validation";

export type RequestFormState = {
  status: "idle" | "error" | "success";
  ref?: string;
  datasetSlug?: string;
  errors?: Partial<Record<string, FieldErrorCode | AttachmentErrorCode | "generic">>;
  values?: Record<string, string>;
};

const SUBMIT_WINDOW_MS = 60 * 60 * 1000;
const SUBMITS_PER_EMAIL = 3;
const SUBMITS_PER_IP = 8;

function safeExt(name: string): string {
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")).toLowerCase() : "";
  if ([".pdf", ".jpg", ".jpeg", ".png"].includes(ext)) return ext === ".jpeg" ? ".jpg" : ext;
  return ".bin";
}

export async function submitAccessRequest(
  _prev: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  const slug = String(formData.get("dataset_slug") ?? "");
  const dataset = getDataset(slug);
  const values = readRequestValues(formData);
  const agreed = formData.get("agree") === "on";
  const honeypot = String(formData.get("website") ?? "").trim();
  const attachment = readAttachment(formData);

  if (!dataset) {
    return { status: "error", errors: { form: "generic" }, values };
  }

  // Silent bot trap: do not write, do not tell the bot why.
  if (honeypot) {
    return { status: "error", errors: { form: "generic" }, values };
  }

  const requestHeaders = await headers();
  const ip = clientIp(requestHeaders);
  const emailKey = `request:email:${values.email.toLowerCase()}`;
  const ipKey = `request:ip:${ip}`;
  if (checkLimit(emailKey, SUBMITS_PER_EMAIL).blocked || checkLimit(ipKey, SUBMITS_PER_IP).blocked) {
    writeAudit({
      actorEmail: values.email,
      action: "request.throttled",
      detail: `ip=${ip}`,
    });
    return { status: "error", errors: { form: "generic" }, values };
  }

  const errors = validateRequest(values, agreed, attachment);
  if (attachment && !errors.attachment && !(await attachmentContentMatchesType(attachment))) {
    errors.attachment = "attachment_type";
  }
  if (Object.keys(errors).length > 0) {
    return { status: "error", errors: errors as RequestFormState["errors"], values };
  }

  try {
    let attachment_name: string | null = null;
    let attachment_path: string | null = null;

    if (attachment) {
      const dir = path.join(process.cwd(), "data", "request-attachments");
      await mkdir(dir, { recursive: true });
      const stamp = Date.now().toString(36);
      const ext = safeExt(attachment.name || "");
      const filename = `req-${stamp}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      const full = path.join(dir, filename);
      const bytes = Buffer.from(await attachment.arrayBuffer());
      await writeFile(full, bytes);
      attachment_name = (attachment.name || filename).slice(0, 200);
      attachment_path = path.join("data", "request-attachments", filename);
    }

    recordHit(emailKey, SUBMIT_WINDOW_MS);
    recordHit(ipKey, SUBMIT_WINDOW_MS);

    const request = createAccessRequest({
      dataset_slug: dataset.slug,
      dataset_title: dataset.title.en,
      full_name: values.full_name,
      email: values.email,
      organization: values.organization,
      position: values.position,
      purpose: values.purpose,
      intended_use: values.intended_use,
      area_of_interest: values.area_of_interest,
      attachment_name,
      attachment_path,
    });

    writeAudit({
      actorEmail: request.email,
      action: "request.submitted",
      target: request.ref,
      detail: `dataset=${dataset.slug}${attachment_name ? "; attachment=1" : ""}`,
    });

    // Best-effort acknowledgement. The request is already stored, so a mail
    // outage must never make the requester think their submission failed.
    try {
      if (isMailConfigured()) {
        const content = acknowledgementEmail({
          ref: request.ref,
          fullName: request.full_name,
          datasetTitle: request.dataset_title,
          submittedAt: formatDateTime(request.created_at),
        });
        await sendMail({
          to: request.email,
          subject: content.subject,
          text: content.text,
          html: content.html,
        });
        markRequestNotified(request.id);
        writeAudit({
          actorEmail: request.email,
          action: "email.sent",
          target: request.ref,
          detail: `acknowledgement to=${request.email}`,
        });
      } else {
        writeAudit({
          actorEmail: request.email,
          action: "email.skipped",
          target: request.ref,
          detail: "SMTP not configured; acknowledgement not sent",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown SMTP error";
      markRequestNotified(request.id, message.slice(0, 500));
      writeAudit({
        actorEmail: request.email,
        action: "email.failed",
        target: request.ref,
        detail: message.slice(0, 300),
      });
    }

    return { status: "success", ref: request.ref, datasetSlug: dataset.slug };
  } catch {
    return { status: "error", errors: { form: "generic" }, values };
  }
}

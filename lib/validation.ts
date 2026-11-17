export type FieldErrorCode = "required" | "email" | "short" | "long";
export type AttachmentErrorCode = "attachment_type" | "attachment_size";

export type RequestValues = {
  full_name: string;
  email: string;
  organization: string;
  position: string;
  purpose: string;
  intended_use: string;
  area_of_interest: string;
};

const LIMITS: Record<keyof RequestValues, { min: number; max: number }> = {
  full_name: { min: 2, max: 120 },
  email: { min: 5, max: 200 },
  organization: { min: 2, max: 160 },
  position: { min: 0, max: 120 },
  purpose: { min: 15, max: 1000 },
  intended_use: { min: 15, max: 1000 },
  area_of_interest: { min: 0, max: 200 },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_ATTACHMENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const ALLOWED_ATTACHMENT_EXT = new Set([".pdf", ".jpg", ".jpeg", ".png"]);

export function readRequestValues(formData: FormData): RequestValues {
  const get = (key: string) => String(formData.get(key) ?? "").trim();
  return {
    full_name: get("full_name"),
    email: get("email"),
    organization: get("organization"),
    position: get("position"),
    purpose: get("purpose"),
    intended_use: get("intended_use"),
    area_of_interest: get("area_of_interest"),
  };
}

export function readAttachment(formData: FormData): File | null {
  const file = formData.get("attachment");
  if (!file || !(file instanceof File) || file.size === 0) return null;
  return file;
}

export function validateAttachment(file: File | null): AttachmentErrorCode | null {
  if (!file) return null;
  const name = file.name || "";
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")).toLowerCase() : "";
  const typeOk = ALLOWED_ATTACHMENT_TYPES.has(file.type) || ALLOWED_ATTACHMENT_EXT.has(ext);
  if (!typeOk) return "attachment_type";
  if (file.size > MAX_ATTACHMENT_BYTES) return "attachment_size";
  return null;
}

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_MAGIC = [0xff, 0xd8, 0xff];

function startsWith(bytes: Uint8Array, magic: number[]): boolean {
  if (bytes.length < magic.length) return false;
  return magic.every((byte, index) => bytes[index] === byte);
}

/**
 * File extensions and MIME types are attacker-controlled. Verify the magic
 * bytes so a renamed HTML/EXE cannot be stored as a "PDF" and later served
 * from the portal's origin.
 */
export async function attachmentContentMatchesType(file: File): Promise<boolean> {
  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase() : "";
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  switch (ext) {
    case ".pdf":
      return startsWith(head, PDF_MAGIC);
    case ".png":
      return startsWith(head, PNG_MAGIC);
    case ".jpg":
    case ".jpeg":
      return startsWith(head, JPEG_MAGIC);
    default:
      return false;
  }
}

export function validateRequest(
  values: RequestValues,
  agreed: boolean,
  attachment: File | null = null,
): Partial<Record<keyof RequestValues | "agree" | "attachment", FieldErrorCode | AttachmentErrorCode>> {
  const errors: Partial<Record<keyof RequestValues | "agree" | "attachment", FieldErrorCode | AttachmentErrorCode>> = {};

  for (const key of Object.keys(LIMITS) as (keyof RequestValues)[]) {
    const value = values[key];
    const limit = LIMITS[key];
    if (limit.min > 0 && value.length === 0) {
      errors[key] = "required";
      continue;
    }
    if (value.length > 0 && value.length < limit.min) {
      errors[key] = "short";
      continue;
    }
    if (value.length > limit.max) {
      errors[key] = "long";
    }
  }

  if (values.email && !EMAIL_RE.test(values.email)) {
    errors.email = "email";
  }
  if (!agreed) {
    errors.agree = "required";
  }
  const attErr = validateAttachment(attachment);
  if (attErr) errors.attachment = attErr;

  return errors;
}



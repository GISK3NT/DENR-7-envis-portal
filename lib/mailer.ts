import nodemailer, { type Transporter } from "nodemailer";

/**
 * Outbound email for the request desk.
 *
 * Works with any free mailbox that offers SMTP:
 *   gmail   smtp.gmail.com:465      (requires a Google App Password)
 *   yahoo   smtp.mail.yahoo.com:465 (requires a Yahoo App Password)
 *   outlook smtp-mail.outlook.com:587 (STARTTLS; app password if 2FA is on)
 *   proton  127.0.0.1:1025          (requires Proton Mail Bridge)
 *   smtp    any host/port           (set ENVIS_SMTP_HOST/PORT/SECURE)
 *
 * Configure with env vars (see .env.example). Nothing is hard-coded.
 */

export type MailProvider = "gmail" | "yahoo" | "outlook" | "proton" | "smtp";

type Preset = { host: string; port: number; secure: boolean; label: string };

const PRESETS: Record<Exclude<MailProvider, "smtp">, Preset> = {
  gmail: { host: "smtp.gmail.com", port: 465, secure: true, label: "Gmail" },
  yahoo: { host: "smtp.mail.yahoo.com", port: 465, secure: true, label: "Yahoo Mail" },
  outlook: { host: "smtp-mail.outlook.com", port: 587, secure: false, label: "Outlook / Hotmail" },
  proton: { host: "127.0.0.1", port: 1025, secure: false, label: "Proton Mail Bridge" },
};

export type MailSettings = {
  provider: MailProvider;
  label: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  replyTo: string | null;
};

function flag(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  return value === "1" || value.toLowerCase() === "true" || value.toLowerCase() === "yes";
}

export function mailSettings(): MailSettings {
  const provider = (process.env.ENVIS_MAIL_PROVIDER ?? "gmail").toLowerCase() as MailProvider;
  const preset = provider !== "smtp" ? PRESETS[provider] : undefined;

  const host = process.env.ENVIS_SMTP_HOST?.trim() || preset?.host || "";
  const port = Number(process.env.ENVIS_SMTP_PORT ?? preset?.port ?? 587);
  const secure = flag(process.env.ENVIS_SMTP_SECURE, preset?.secure ?? port === 465);
  const user = process.env.ENVIS_SMTP_USER?.trim() || process.env.ENVIS_MAIL_FROM?.trim() || "";
  const pass = process.env.ENVIS_SMTP_PASS ?? "";
  const from = process.env.ENVIS_MAIL_FROM?.trim() || user;

  return {
    provider,
    label: preset?.label ?? "SMTP",
    host,
    port,
    secure,
    user,
    pass,
    from,
    replyTo: process.env.ENVIS_MAIL_REPLY_TO?.trim() || null,
  };
}

export function isMailConfigured(): boolean {
  const s = mailSettings();
  return Boolean(s.host && s.user && s.pass && s.from);
}

export type MailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: MailAttachment[];
};

declare global {
  // eslint-disable-next-line no-var
  var __envisMailer: Transporter | undefined;
}

function transporter(): Transporter {
  if (globalThis.__envisMailer) return globalThis.__envisMailer;
  const s = mailSettings();
  const transport = nodemailer.createTransport({
    host: s.host,
    port: s.port,
    secure: s.secure,
    auth: { user: s.user, pass: s.pass },
    // Free mailboxes often have slow TLS handshakes; fail fast instead of hanging a request.
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  });
  globalThis.__envisMailer = transport;
  return transport;
}

/** Throws on failure so the caller can surface the reason in the console. */
export async function sendMail(message: MailMessage): Promise<void> {
  const s = mailSettings();
  await transporter().sendMail({
    from: s.from,
    replyTo: s.replyTo ?? undefined,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
    attachments: message.attachments?.map((file) => ({
      filename: file.filename,
      content: file.content,
      contentType: file.contentType,
    })),
  });
}

/** Human-readable provider summary for the admin console (never includes the password). */
export function describeMail(): { configured: boolean; label: string; from: string; hint: string } {
  const s = mailSettings();
  if (!isMailConfigured()) {
    return {
      configured: false,
      label: s.label,
      from: s.from,
      hint: "Outbound email is not configured. Add SMTP credentials to the environment file.",
    };
  }
  return {
    configured: true,
    label: s.label,
    from: s.from,
    hint: `${s.host}:${s.port} (${s.secure ? "TLS" : "STARTTLS"})`,
  };
}

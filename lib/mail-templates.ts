/**
 * Email copy for the request desk.
 *
 * Every message is written automatically in English and Filipino so the
 * requestee gets a complete reply without staff typing anything. Staff can
 * still add a short custom note, which is inserted above the boilerplate.
 */

export type MailContent = { subject: string; text: string; html: string };

const BRAND = "ENVIS · DENR Region VII";
const FOREST = "#14352a";
const BRASS = "#b08d57";
const INK = "#1f2d27";
const MUTED = "#5b6b63";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function paragraphs(value: string): string {
  return value
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => `<p style="margin:0 0 12px;line-height:1.65;color:${INK};font-size:14px;">${esc(chunk).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function shell(input: { title: string; preheader: string; body: string }): string {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f4f1ea;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(input.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e3ddd0;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:${FOREST};padding:20px 26px;">
                <p style="margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#d9c9a6;">${BRAND}</p>
                <h1 style="margin:8px 0 0;font-size:20px;line-height:1.3;color:#ffffff;font-weight:600;">${esc(input.title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:26px;">${input.body}</td>
            </tr>
            <tr>
              <td style="padding:18px 26px;border-top:1px solid #eee7da;background:#faf8f3;">
                <p style="margin:0;font-size:11px;line-height:1.6;color:${MUTED};">
                  ENVIS — Environmental Information and Visualization System<br />
                  Department of Environment and Natural Resources, Region VII (Central Visayas)<br />
                  This is an automated message. Reply to this email to reach the review team.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function detailsTable(rows: { label: string; value: string }[]): string {
  const cells = rows
    .map(
      (row) => `<tr>
        <td style="padding:6px 0;width:150px;vertical-align:top;font-size:12px;letter-spacing:.4px;text-transform:uppercase;color:${MUTED};">${esc(row.label)}</td>
        <td style="padding:6px 0;vertical-align:top;font-size:14px;font-weight:600;color:${INK};">${esc(row.value)}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-collapse:collapse;">${cells}</table>`;
}

function callout(text: string, tone: "good" | "warn" | "info"): string {
  const palette = {
    good: { bg: "#eef7f1", border: "#b9dcc7", label: "#1d6b43" },
    warn: { bg: "#fdf3ef", border: "#f0c7b6", label: "#a34226" },
    info: { bg: "#f1f5f8", border: "#c9d8e2", label: "#27556f" },
  }[tone];
  return `<div style="margin:0 0 20px;padding:14px 16px;background:${palette.bg};border:1px solid ${palette.border};border-radius:8px;">
    <p style="margin:0;font-size:13px;line-height:1.6;color:${palette.label};">${esc(text)}</p>
  </div>`;
}

function signatureBlock(): string {
  return `<p style="margin:22px 0 0;font-size:13px;line-height:1.7;color:${MUTED};">
    Respectfully,<br />
    <strong style="color:${INK};">ENVIS Review Team</strong><br />
    DENR Region VII · Geospatial Information Services
  </p>`;
}

/* --------------------------------------------------------- acknowledgement */

export function acknowledgementEmail(input: {
  ref: string;
  fullName: string;
  datasetTitle: string;
  submittedAt: string;
}): MailContent {
  const subject = `[ENVIS ${input.ref}] Request received / Natanggap ang kahilingan`;

  const text = `Dear ${input.fullName},

Your request for the dataset "${input.datasetTitle}" has been received and is now in the review queue.

Reference number: ${input.ref}
Dataset: ${input.datasetTitle}
Submitted: ${input.submittedAt}

Our review team checks every request for completeness, intended use, and data-sharing conditions. You will receive a second email once a decision has been recorded. Please keep your reference number for follow-up.

To reply, simply answer this email.

------------------------------------------------------------------------

Mahal na ${input.fullName},

Natanggap na ang inyong kahilingan para sa dataset na "${input.datasetTitle}" at kasalukuyan itong nasa pila ng pagsusuri.

Numero ng referensya: ${input.ref}
Dataset: ${input.datasetTitle}
Petsa ng pagsusumite: ${input.submittedAt}

Sinusuri ng aming koponan ang bawat kahilingan batay sa pagkakumpleto, nilalayong gamit, at mga kondisyon sa pagbabahagi ng datos. Makakatanggap kayo ng pangalawang email kapag may naitalang desisyon. Pakitago ang numero ng referensya para sa follow-up.

Upang tumugon, sagutin lamang ang email na ito.

ENVIS Review Team
DENR Region VII`;

  const body = `
    ${paragraphs(`Dear ${input.fullName},\n\nYour request for the dataset "${input.datasetTitle}" has been received and is now in the review queue.`)}
    ${detailsTable([
      { label: "Reference", value: input.ref },
      { label: "Dataset", value: input.datasetTitle },
      { label: "Submitted", value: input.submittedAt },
    ])}
    ${callout("You will receive a second email once a decision has been recorded. Please keep your reference number for follow-up.", "info")}
    <div style="margin:22px 0 0;padding-top:18px;border-top:1px dashed #e3ddd0;">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:${BRASS};font-weight:600;">Filipino</p>
      ${paragraphs(`Mahal na ${input.fullName},\n\nNatanggap na ang inyong kahilingan para sa dataset na "${input.datasetTitle}" at kasalukuyan itong nasa pila ng pagsusuri. Makakatanggap kayo ng pangalawang email kapag may naitalang desisyon. Pakitago ang numero ng referensya para sa follow-up.`)}
    </div>
    ${signatureBlock()}`;

  return {
    subject,
    text,
    html: shell({ title: "Request received", preheader: `Reference ${input.ref}`, body }),
  };
}

/* ------------------------------------------------------------ decision mail */

export function decisionEmail(input: {
  ref: string;
  fullName: string;
  datasetTitle: string;
  status: "approved" | "declined";
  reviewerNote?: string | null;
  customMessage?: string | null;
  hasAttachment?: boolean;
}): MailContent {
  const approved = input.status === "approved";
  const subject = approved
    ? `[ENVIS ${input.ref}] Request approved / Aprubado ang kahilingan`
    : `[ENVIS ${input.ref}] Request declined / Tinanggihan ang kahilingan`;

  const enOutcome = approved
    ? "Your request has been approved. The dataset will be released through the channel agreed with our team. If a release package is attached to this message, it may be used only for the purpose stated in your request."
    : "Your request has not been approved. The reason from the review team is shown below. You may submit a new request if your circumstances change or if you can provide the missing information.";

  const filOutcome = approved
    ? "Inaprubahan ang inyong kahilingan. Ilalabas ang dataset sa pamamaraang napagkasunduan ng aming koponan. Kung may nakalakip na release package sa mensaheng ito, maaari lamang itong gamitin para sa layuning nakasaad sa inyong kahilingan."
    : "Hindi naaprubahan ang inyong kahilingan. Ang dahilan mula sa review team ay nakasaad sa ibaba. Maaari kayong magsumite ng bagong kahilingan kung magbabago ang inyong kalagayan o kung makapagbibigay kayo ng nawawalang impormasyon.";

  const note = input.reviewerNote?.trim();
  const custom = input.customMessage?.trim();

  const textParts = [
    `Dear ${input.fullName},`,
    "",
    enOutcome,
    "",
    `Reference number: ${input.ref}`,
    `Dataset: ${input.datasetTitle}`,
    `Decision: ${approved ? "Approved" : "Declined"}`,
  ];
  if (note) textParts.push("", `Review note: ${note}`);
  if (custom) textParts.push("", `Message from the review team: ${custom}`);
  if (approved && input.hasAttachment) textParts.push("", "The release package is attached to this email.");
  textParts.push(
    "",
    "To reply, simply answer this email.",
    "",
    "------------------------------------------------------------------------",
    "",
    `Mahal na ${input.fullName},`,
    "",
    filOutcome,
    "",
    `Numero ng referensya: ${input.ref}`,
    `Dataset: ${input.datasetTitle}`,
    `Desisyon: ${approved ? "Aprubado" : "Tinanggihan"}`,
  );
  if (note) textParts.push("", `Tala ng pagsusuri: ${note}`);
  if (custom) textParts.push("", `Mensahe mula sa review team: ${custom}`);
  textParts.push("", "ENVIS Review Team", "DENR Region VII");

  const customBlock = custom
    ? `<div style="margin:0 0 20px;padding:16px 18px;border-left:3px solid ${BRASS};background:#fbf8f1;">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:${BRASS};font-weight:600;">Message from the review team</p>
        ${paragraphs(custom)}
      </div>`
    : "";

  const body = `
    ${paragraphs(`Dear ${input.fullName},\n\n${enOutcome}`)}
    ${detailsTable([
      { label: "Reference", value: input.ref },
      { label: "Dataset", value: input.datasetTitle },
      { label: "Decision", value: approved ? "Approved" : "Declined" },
    ])}
    ${note ? callout(`Review note: ${note}`, approved ? "good" : "warn") : ""}
    ${customBlock}
    ${approved && input.hasAttachment ? callout("The release package is attached to this email.", "good") : ""}
    ${approved ? callout("Please cite ENVIS and DENR Region VII as the source when publishing maps or statistics derived from this dataset.", "info") : ""}
    <div style="margin:22px 0 0;padding-top:18px;border-top:1px dashed #e3ddd0;">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:${BRASS};font-weight:600;">Filipino</p>
      ${paragraphs(`Mahal na ${input.fullName},\n\n${filOutcome}`)}
      ${note ? paragraphs(`Tala ng pagsusuri: ${note}`) : ""}
    </div>
    ${signatureBlock()}`;

  return {
    subject,
    text: textParts.join("\n"),
    html: shell({
      title: approved ? "Request approved" : "Request declined",
      preheader: `Reference ${input.ref} · ${approved ? "Approved" : "Declined"}`,
      body,
    }),
  };
}

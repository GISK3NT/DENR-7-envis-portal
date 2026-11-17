import Link from "next/link";
import { notFound } from "next/navigation";
import { getAccessRequest, getUserById } from "@/lib/repo";
import { getDataset } from "@/lib/datasets";
import { formatDateTime } from "@/lib/format";
import { approveRequestAction, declineRequestAction, resendDecisionEmailAction } from "@/app/actions/admin";
import { describeMail } from "@/lib/mailer";
import StatusBadge from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function AdminRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const requestId = Number(id);
  if (!Number.isFinite(requestId)) notFound();

  const request = getAccessRequest(requestId);
  if (!request) notFound();

  const dataset = getDataset(request.dataset_slug);
  const reviewer = request.reviewer_id ? getUserById(request.reviewer_id) : undefined;
  const mail = describeMail();

  const details = [
    { label: "Full name", value: request.full_name },
    { label: "Email", value: request.email, href: `mailto:${request.email}` },
    { label: "Organization", value: request.organization },
    { label: "Position", value: request.position || "—" },
    { label: "Area of interest", value: request.area_of_interest || "—" },
    { label: "Submitted", value: formatDateTime(request.created_at) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/requests" className="text-xs font-semibold text-forest-600 hover:text-forest-900">
          ← Requests
        </Link>
        <span className="text-forest-300">/</span>
        <span className="font-mono text-xs text-forest-800">{request.ref}</span>
        <StatusBadge status={request.status} />
      </div>

      <section
        className={`rounded-[10px] border px-4 py-3 text-xs leading-relaxed ${
          mail.configured
            ? "border-forest-200 bg-forest-50 text-forest-800"
            : "border-brass-200 bg-brass-50 text-brass-800"
        }`}
      >
        {mail.configured ? (
          <p>
            <strong>Requester email is on.</strong> Decisions are sent automatically in English and Filipino from{" "}
            <span className="font-mono">{mail.from}</span> via {mail.label} · {mail.hint}. The requester can reply
            directly to that message.
          </p>
        ) : (
          <p>
            <strong>Requester email is not configured yet.</strong> {mail.hint} Add{" "}
            <span className="font-mono">ENVIS_MAIL_PROVIDER</span>,{" "}
            <span className="font-mono">ENVIS_SMTP_USER</span>, and{" "}
            <span className="font-mono">ENVIS_SMTP_PASS</span> (see <span className="font-mono">.env.example</span>)
            then restart the server.
          </p>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className="card p-6">
            <h1 className="font-display text-xl font-bold text-forest-950">Requester</h1>
            <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {details.map((row) => (
                <div key={row.label}>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-forest-500">{row.label}</dt>
                  <dd className="mt-0.5 text-sm text-forest-900">
                    {row.href ? (
                      <a href={row.href} className="font-medium text-forest-700 underline underline-offset-2">
                        {row.value}
                      </a>
                    ) : (
                      row.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="card p-6">
            <h2 className="font-display text-base font-semibold text-forest-950">Purpose</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-forest-800">{request.purpose}</p>

            <h2 className="mt-6 font-display text-base font-semibold text-forest-950">Intended use</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-forest-800">{request.intended_use}</p>

            <h2 className="mt-6 font-display text-base font-semibold text-forest-950">Supporting attachment</h2>
            {request.attachment_name && request.attachment_path ? (
              <div className="mt-2 flex flex-wrap items-center gap-3 rounded-[10px] border border-sand-200 bg-sand-50 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-forest-900">{request.attachment_name}</p>
                  <p className="text-xs text-forest-600">PDF or image uploaded by requester</p>
                </div>
                <a
                  href={`/admin/requests/${request.id}/attachment`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary btn-sm shrink-0"
                >
                  Download attachment
                </a>
              </div>
            ) : (
              <p className="mt-2 text-sm text-forest-600">No attachment provided.</p>
            )}
          </section>

          <section className="card p-6">
            <h2 className="font-display text-base font-semibold text-forest-950">Dataset requested</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-forest-900">{request.dataset_title}</span>
              <Link
                href={`/datasets/${request.dataset_slug}`}
                className="text-xs font-semibold text-forest-700 underline underline-offset-2"
              >
                Public page →
              </Link>
            </div>
            {dataset ? (
              <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
                <div>
                  <dt className="text-forest-500">Features</dt>
                  <dd className="mt-0.5 font-medium text-forest-900">{dataset.featureCount ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-forest-500">Geometry</dt>
                  <dd className="mt-0.5 font-medium capitalize text-forest-900">{dataset.geometryType}</dd>
                </div>
                <div>
                  <dt className="text-forest-500">CRS</dt>
                  <dd className="mt-0.5 font-mono text-[11px] text-forest-900">{dataset.crs}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                This slug is not in the current catalog — it may have been renamed or removed.
              </p>
            )}
          </section>

          <section className="rounded-[10px] border border-sand-200 bg-white/70 p-5 text-xs leading-relaxed text-forest-600">
            <p className="font-semibold text-forest-700">Reminder</p>
            <p className="mt-1">
              Approving a request records your account in the audit log and emails the requester. The public portal
              still has no download endpoint: files leave only through the reviewed email attachment or the agreed
              delivery channel.
            </p>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <form action={approveRequestAction} className="card overflow-hidden">
            <input type="hidden" name="id" value={request.id} />
            <div className="border-b border-forest-100 px-5 py-4">
              <h2 className="font-display text-base font-semibold text-forest-950">Decision</h2>
              <p className="mt-1 text-xs text-forest-600">
                {request.status === "pending"
                  ? "This request is awaiting a decision. Approving or declining sends the requester an automatic bilingual email."
                  : "A decision has been recorded. Re-submitting sends a fresh email with the current note and attachment."}
              </p>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div>
                <label className="field-label" htmlFor="reply">
                  Message to requester <span className="font-normal normal-case tracking-normal text-forest-500">(optional)</span>
                </label>
                <textarea
                  id="reply"
                  name="reply"
                  rows={4}
                  defaultValue={request.reply_message ?? ""}
                  placeholder="Add a short personal note. Leave blank to send the standard bilingual reply."
                  className="field-input resize-y"
                />
                <p className="field-hint">
                  Inserted into the automatic email above the standard English and Filipino text.
                </p>
              </div>

              <div>
                <label className="field-label" htmlFor="reply_attachment">
                  Attach the release package <span className="font-normal normal-case tracking-normal text-forest-500">(optional)</span>
                </label>
                <input
                  id="reply_attachment"
                  name="reply_attachment"
                  type="file"
                  accept=".pdf,.zip,.7z,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.csv,.txt,.shp,.geojson,.gpkg,.kml,.kmz"
                  className="field-input file:mr-3 file:rounded-md file:border-0 file:bg-forest-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-forest-800"
                />
                <p className="field-hint">
                  Sent only when the request is approved. Max 15 MB. Files are kept privately in{" "}
                  <span className="font-mono">private_data/outbox</span> and are never web-accessible.
                </p>
                {request.reply_attachment_name ? (
                  <p className="mt-1.5 text-[11px] text-forest-600">
                    Current file: <span className="font-medium">{request.reply_attachment_name}</span> — choose a new
                    file to replace it.
                  </p>
                ) : null}
              </div>

              <div>
                <label className="field-label" htmlFor="note">
                  Internal reviewer note
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows={3}
                  defaultValue={request.reviewer_note ?? ""}
                  placeholder="Reason for the decision, delivery instructions, caveats…"
                  className="field-input resize-y"
                />
                <p className="field-hint">
                  Stored in the console and audit log. It is also quoted in the decision email.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-forest-100 bg-forest-50/40 px-5 py-4">
              <button type="submit" className="btn-primary w-full">
                Approve request
              </button>
              <button type="submit" formAction={declineRequestAction} className="btn-danger w-full">
                Decline request
              </button>
            </div>
          </form>

          {request.reviewed_at ? (
            <section className="card p-5">
              <h2 className="font-display text-base font-semibold text-forest-950">Last review</h2>
              <dl className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-forest-600">Reviewer</dt>
                  <dd className="font-medium text-forest-900">{reviewer?.name ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-forest-600">Role</dt>
                  <dd className="font-medium capitalize text-forest-900">{reviewer?.role ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-forest-600">Reviewed</dt>
                  <dd className="font-medium text-forest-900">{formatDateTime(request.reviewed_at)}</dd>
                </div>
              </dl>
              {request.reviewer_note ? (
                <p className="mt-3 rounded-lg bg-forest-50 px-3 py-2 text-xs leading-relaxed text-forest-800">
                  {request.reviewer_note}
                </p>
              ) : null}

              {request.reply_message ? (
                <div className="mt-3 rounded-lg border border-sand-200 bg-white px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-forest-500">
                    Message sent to requester
                  </p>
                  <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-forest-800">
                    {request.reply_message}
                  </p>
                </div>
              ) : null}

              <div className="mt-3 border-t border-sand-200 pt-3 text-xs">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-forest-500">
                  Requester email
                </p>
                {request.notified_at ? (
                  <p className="mt-1 font-medium text-forest-800">
                    Sent {formatDateTime(request.notified_at)} to{" "}
                    <span className="font-normal">{request.email}</span>
                  </p>
                ) : request.notify_error ? (
                  <p className="mt-1 font-medium text-red-700">Not sent: {request.notify_error}</p>
                ) : (
                  <p className="mt-1 text-forest-600">No email sent yet.</p>
                )}

                {request.status !== "pending" ? (
                  <form action={resendDecisionEmailAction} className="mt-2">
                    <input type="hidden" name="id" value={request.id} />
                    <button type="submit" className="btn-secondary btn-sm" disabled={!mail.configured}>
                      Resend decision email
                    </button>
                  </form>
                ) : null}
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { submitAccessRequest, type RequestFormState } from "@/app/actions/request";

const initialRequestState: RequestFormState = { status: "idle" };

type Props = {
  slug: string;
  title: string;
  t: Dictionary;
};

const ERRORS = {
  required: "error_required",
  email: "error_email",
  short: "error_short",
  long: "error_long",
  agree: "error_agree",
  generic: "error_generic",
} as const;

export default function RequestForm({ slug, title, t }: Props) {
  const [state, formAction, pending] = useActionState(submitAccessRequest, initialRequestState);

  if (state.status === "success" && state.ref) {
    return (
      <div className="card mx-auto max-w-xl overflow-hidden">
        <div className="bg-forest-900 px-6 py-8 text-center text-forest-50">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-forest-700 text-xl">✓</div>
          <h2 className="mt-4 font-display text-2xl font-bold text-white">{t.request.success_title}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-forest-100/85">{t.request.success_body}</p>
        </div>
        <div className="px-6 py-6">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-forest-600">
            {t.request.reference}
          </p>
          <p className="mt-2 text-center font-mono text-2xl font-bold tracking-wide text-forest-950">{state.ref}</p>
          <p className="mt-1 text-center text-sm text-forest-700">{title}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/datasets" className="btn-secondary">
              {t.nav.catalog}
            </Link>
            <Link href={`/request/${slug}`} className="btn-ghost">
              {t.request.success_again}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const errorFor = (field: string) => {
    const code = state.errors?.[field];
    if (!code) return null;
    const key =
      code === "email"
        ? "error_email"
        : code === "short"
          ? "error_short"
          : code === "long"
            ? "error_long"
            : code === "attachment_type"
              ? "error_attachment_type"
              : code === "attachment_size"
                ? "error_attachment_size"
                : code === "generic"
                  ? "error_generic"
                  : field === "agree" && code === "required"
                    ? "error_agree"
                    : "error_required";
    return <p className="field-error">{(t.request as Record<string, string>)[key] ?? t.request.error_generic}</p>;
  };

  const fieldErrorClass = (field: string) =>
    state.errors?.[field] ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "";

  return (
    <form action={formAction} encType="multipart/form-data" className="card overflow-hidden">
      <input type="hidden" name="dataset_slug" value={slug} />

      {/* Honeypot — hidden from humans and assistive tech */}
      <div aria-hidden className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state.errors?.form ? (
        <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-800">{t.request.error_generic}</div>
      ) : null}

      <div className="space-y-8 px-6 py-7">
        <section>
          <h2 className="font-display text-lg font-semibold text-forest-950">
            <span className="mr-2 text-forest-400">01</span>
            {t.request.section_requester}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="full_name">
                {t.request.full_name} *
              </label>
              <input
                id="full_name"
                name="full_name"
                required
                autoComplete="name"
                defaultValue={state.values?.full_name}
                className={`field-input ${fieldErrorClass("full_name")}`}
              />
              {errorFor("full_name")}
            </div>
            <div>
              <label className="field-label" htmlFor="email">
                {t.request.email} *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                defaultValue={state.values?.email}
                className={`field-input ${fieldErrorClass("email")}`}
              />
              {errorFor("email")}
            </div>
            <div>
              <label className="field-label" htmlFor="organization">
                {t.request.organization} *
              </label>
              <input
                id="organization"
                name="organization"
                required
                autoComplete="organization"
                defaultValue={state.values?.organization}
                className={`field-input ${fieldErrorClass("organization")}`}
              />
              {errorFor("organization")}
            </div>
            <div>
              <label className="field-label" htmlFor="position">
                {t.request.position}
              </label>
              <input
                id="position"
                name="position"
                autoComplete="organization-title"
                defaultValue={state.values?.position}
                className={`field-input ${fieldErrorClass("position")}`}
              />
              {errorFor("position")}
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-forest-950">
            <span className="mr-2 text-forest-400">02</span>
            {t.request.section_purpose}
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="field-label" htmlFor="purpose">
                {t.request.purpose} *
              </label>
              <textarea
                id="purpose"
                name="purpose"
                required
                rows={3}
                maxLength={1000}
                defaultValue={state.values?.purpose}
                className={`field-input resize-y ${fieldErrorClass("purpose")}`}
              />
              <p className="field-hint">{t.request.purpose_hint}</p>
              {errorFor("purpose")}
            </div>
            <div>
              <label className="field-label" htmlFor="intended_use">
                {t.request.intended_use} *
              </label>
              <textarea
                id="intended_use"
                name="intended_use"
                required
                rows={3}
                maxLength={1000}
                defaultValue={state.values?.intended_use}
                className={`field-input resize-y ${fieldErrorClass("intended_use")}`}
              />
              <p className="field-hint">{t.request.intended_use_hint}</p>
              {errorFor("intended_use")}
            </div>
            <div>
              <label className="field-label" htmlFor="area_of_interest">
                {t.request.area_of_interest}
              </label>
              <input
                id="area_of_interest"
                name="area_of_interest"
                maxLength={200}
                defaultValue={state.values?.area_of_interest}
                className={`field-input ${fieldErrorClass("area_of_interest")}`}
              />
              <p className="field-hint">{t.request.area_hint}</p>
              {errorFor("area_of_interest")}
            </div>
            <div>
              <label className="field-label" htmlFor="attachment">
                {(t.request as Record<string, string>).attachment ?? "Supporting document (PDF or image)"}
              </label>
              <input
                id="attachment"
                name="attachment"
                type="file"
                accept=".pdf,application/pdf,image/jpeg,image/png,.jpg,.jpeg,.png"
                className={`field-input file:mr-3 file:rounded-md file:border-0 file:bg-forest-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-forest-900 ${fieldErrorClass("attachment")}`}
              />
              <p className="field-hint">
                {(t.request as Record<string, string>).attachment_hint ??
                  "Optional. Attach a PDF or image (JPG, PNG) to support your request. Max 10 MB."}
              </p>
              {errorFor("attachment")}
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-forest-950">
            <span className="mr-2 text-forest-400">03</span>
            {t.request.section_terms}
          </h2>
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-[10px] border border-sand-200 bg-sand-50/60 p-4">
            <input
              type="checkbox"
              name="agree"
              required
              className="mt-0.5 h-4 w-4 rounded border-forest-300 text-forest-700 focus:ring-forest-400"
            />
            <span className="text-sm leading-relaxed text-forest-900">
              {t.request.agree}{" "}
              <Link href="/terms" target="_blank" className="font-semibold underline underline-offset-2">
                {t.request.agree_link}
              </Link>
            </span>
          </label>
          {errorFor("agree")}
        </section>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-forest-100 bg-forest-50/40 px-6 py-4">
        <p className="text-xs text-forest-600">{t.request.required_note}</p>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? t.request.submitting : t.request.submit}
        </button>
      </div>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/actions/admin";
import { Logo } from "@/components/logo";

const initialLoginState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialLoginState);

  return (
    <form action={formAction} className="w-full max-w-[400px]">
      <div className="relative overflow-hidden rounded-card border border-forest-800/70 bg-white shadow-2xl">
        <div aria-hidden className="h-1 w-full bg-gradient-to-r from-brass-500 via-brass-300 to-transparent" />

        <div className="p-7">
          <div className="flex items-center gap-3">
            <Logo size={40} variant="static" />
            <div>
              <p className="font-display text-[15px] font-semibold leading-none tracking-tight text-forest-950">
                ENVIS Console
              </p>
              <p className="mt-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-forest-600">
                DENR Region VII
              </p>
            </div>
          </div>

          <h1 className="mt-7 font-display text-[26px] font-semibold leading-none tracking-tightest text-forest-950">
            Staff sign in
          </h1>
          <p className="mt-2 text-[13px] leading-6 text-forest-700">
            Review console for dataset requests and release records.
          </p>

          {state.error ? (
            <p
              role="alert"
              className="mt-4 rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800"
            >
              {state.error}
            </p>
          ) : null}

          <div className="mt-6 space-y-4">
            <div>
              <label className="field-label" htmlFor="identifier">
                Username or email
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                required
                autoComplete="username"
                autoFocus
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="field-input"
              />
            </div>
          </div>

          <button type="submit" disabled={pending} className="btn-primary mt-6 w-full">
            {pending ? "Signing in…" : "Sign in"}
            {pending ? null : <span aria-hidden>→</span>}
          </button>

          <p className="mt-4 border-t border-sand-200 pt-3.5 text-[10.5px] leading-relaxed text-forest-500">
            Accounts are issued by the Regional Planning and Information Unit. Access is logged.
          </p>
        </div>
      </div>

      <p className="mt-5 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-forest-400">
        <Link href="/" className="transition hover:text-sand-100">
          ← Public portal
        </Link>
      </p>
    </form>
  );
}

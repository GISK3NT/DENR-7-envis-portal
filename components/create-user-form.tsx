"use client";

import { useActionState } from "react";
import { createUserAction, type UserFormState } from "@/app/actions/admin";

const initialState: UserFormState = {};

export default function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createUserAction, initialState);

  return (
    <form action={formAction} className="card p-5">
      <h2 className="font-display text-base font-semibold text-forest-950">Add an account</h2>
      <p className="mt-1 text-xs text-forest-600">
        Use a work email. Passwords are hashed with scrypt and never stored in plain text.
      </p>

      {state.error ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="mt-3 rounded-lg border border-forest-200 bg-forest-50 px-3 py-2 text-xs font-medium text-forest-800">
          Account created.
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="name">
            Name
          </label>
          <input id="name" name="name" required className="field-input" />
        </div>
        <div>
          <label className="field-label" htmlFor="new-username">
            Username
          </label>
          <input id="new-username" name="username" className="field-input" placeholder="e.g. envisadmin" />
          <p className="field-hint">Optional. Used to sign in without typing an email.</p>
        </div>
        <div>
          <label className="field-label" htmlFor="new-email">
            Email
          </label>
          <input id="new-email" name="email" type="email" required className="field-input" />
        </div>
        <div>
          <label className="field-label" htmlFor="password">
            Temporary password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            className="field-input"
          />
          <p className="field-hint">At least 10 characters.</p>
        </div>
        <div>
          <label className="field-label" htmlFor="role">
            Role
          </label>
          <select id="role" name="role" defaultValue="reviewer" className="field-input">
            <option value="reviewer">Reviewer — can decide requests</option>
            <option value="admin">Administrator — can also manage accounts</option>
          </select>
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn-primary mt-4">
        {pending ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}

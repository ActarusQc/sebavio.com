"use client";

import { useActionState } from "react";
import { submitContactAction } from "../actions/submit-contact-action";
import type { ContactActionResult } from "../actions/submit-contact";
import { CONTACT_PAGE } from "../lib/trust-content";

const initialState: ContactActionResult | null = null;

export function ContactForm({ supportEmail }: { supportEmail: string }) {
  const [state, formAction, pending] = useActionState(
    submitContactAction,
    initialState,
  );

  if (state?.ok) {
    return (
      <div
        className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6"
        role="status"
        aria-live="polite"
      >
        <h2 className="font-heading text-lg font-semibold text-emerald-900">
          {CONTACT_PAGE.form.successTitle}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-emerald-800">
          {CONTACT_PAGE.form.successBody}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state && !state.ok ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
          aria-live="assertive"
        >
          {state.error}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="contact-name"
          className="block text-sm font-medium text-[#082b46]"
        >
          {CONTACT_PAGE.form.nameLabel}
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          maxLength={120}
          className="mt-1.5 w-full rounded-xl border border-[#c5d4e2] bg-white px-3 py-2.5 text-sm text-[#082b46] outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
          aria-invalid={Boolean(state?.fieldErrors?.name)}
          aria-describedby={
            state?.fieldErrors?.name ? "contact-name-error" : undefined
          }
        />
        {state?.fieldErrors?.name ? (
          <p id="contact-name-error" className="mt-1 text-sm text-red-700">
            {state.fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="contact-email"
          className="block text-sm font-medium text-[#082b46]"
        >
          {CONTACT_PAGE.form.emailLabel}
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          className="mt-1.5 w-full rounded-xl border border-[#c5d4e2] bg-white px-3 py-2.5 text-sm text-[#082b46] outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
          aria-invalid={Boolean(state?.fieldErrors?.email)}
          aria-describedby={
            state?.fieldErrors?.email ? "contact-email-error" : undefined
          }
        />
        {state?.fieldErrors?.email ? (
          <p id="contact-email-error" className="mt-1 text-sm text-red-700">
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="contact-category"
          className="block text-sm font-medium text-[#082b46]"
        >
          {CONTACT_PAGE.form.categoryLabel}
        </label>
        <select
          id="contact-category"
          name="category"
          required
          defaultValue=""
          className="mt-1.5 w-full rounded-xl border border-[#c5d4e2] bg-white px-3 py-2.5 text-sm text-[#082b46] outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
          aria-invalid={Boolean(state?.fieldErrors?.category)}
        >
          <option value="" disabled>
            Choisir un sujet
          </option>
          {CONTACT_PAGE.subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
        {state?.fieldErrors?.category ? (
          <p className="mt-1 text-sm text-red-700">
            {state.fieldErrors.category}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="block text-sm font-medium text-[#082b46]"
        >
          {CONTACT_PAGE.form.messageLabel}
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          maxLength={4000}
          className="mt-1.5 w-full rounded-xl border border-[#c5d4e2] bg-white px-3 py-2.5 text-sm text-[#082b46] outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
          aria-invalid={Boolean(state?.fieldErrors?.message)}
        />
        {state?.fieldErrors?.message ? (
          <p className="mt-1 text-sm text-red-700">
            {state.fieldErrors.message}
          </p>
        ) : null}
      </div>

      {/* Honeypot — invisible aux utilisateurs */}
      <div
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
        aria-hidden
      >
        <label htmlFor="contact-company">Entreprise</label>
        <input
          id="contact-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="flex items-start gap-3">
        <input
          id="contact-consent"
          name="consent"
          type="checkbox"
          required
          className="mt-1 size-4 rounded border-[#c5d4e2] text-[#3b82f6] focus-visible:ring-[#3b82f6]"
        />
        <label htmlFor="contact-consent" className="text-sm text-[#405466]">
          {CONTACT_PAGE.form.consentLabel}
        </label>
      </div>
      {state?.fieldErrors?.consent ? (
        <p className="text-sm text-red-700">{state.fieldErrors.consent}</p>
      ) : null}

      <p className="text-xs text-[#60758a]">
        Vous pouvez aussi nous écrire directement à{" "}
        <a
          href={`mailto:${supportEmail}`}
          className="font-medium text-[#3b6f9c] underline-offset-2 hover:underline"
        >
          {supportEmail}
        </a>
        .
      </p>

      <button
        type="submit"
        disabled={pending}
        className="font-heading inline-flex h-11 items-center justify-center rounded-[var(--radius-button)] bg-gradient-to-r from-[#f0b64d] to-[#e8923a] px-5 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-105 focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Envoi en cours…" : CONTACT_PAGE.form.submitLabel}
      </button>
    </form>
  );
}

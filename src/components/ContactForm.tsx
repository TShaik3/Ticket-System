"use client";

import { useActionState } from "react";
import { sendInquiry, type ContactState } from "@/app/contact/actions";
import { site } from "@/content/site";

export default function ContactForm({ defaultType = "general" }: { defaultType?: string }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendInquiry, {});
  if (state.ok) {
    return (
      <div className="card text-center" role="status">
        <h3 className="display text-xl font-semibold">Thank you!</h3>
        <p className="mt-2 text-muted">We&apos;ve received your message and will get back to you soon.</p>
      </div>
    );
  }
  return (
    <form action={action} className="card space-y-4">
      {/* Honeypot: hidden from people, bots fill it in */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="c-name">Name</label><input id="c-name" name="name" required autoComplete="name" className="input" /></div>
        <div><label className="label" htmlFor="c-email">Email</label><input id="c-email" name="email" type="email" required autoComplete="email" className="input" /></div>
      </div>
      <div>
        <label className="label" htmlFor="c-type">Inquiry type</label>
        <select id="c-type" name="type" defaultValue={defaultType} className="input">
          {site.inquiryTypes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>
      <div><label className="label" htmlFor="c-msg">Message</label><textarea id="c-msg" name="message" rows={5} required className="input" /></div>
      <button className="btn w-full sm:w-auto" disabled={pending}>{pending ? "Sending…" : "Send message"}</button>
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

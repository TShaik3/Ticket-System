"use server";

import { db } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { site } from "@/content/site";

export type ContactState = { error?: string; ok?: boolean };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export async function sendInquiry(_prev: ContactState, fd: FormData): Promise<ContactState> {
  if (String(fd.get("website") ?? "")) return { ok: true }; // honeypot: bots fill this hidden field
  const name = String(fd.get("name") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim();
  const type = String(fd.get("type") ?? "");
  const message = String(fd.get("message") ?? "").trim();
  if (!name || name.length > 120) return { error: "Please enter your name." };
  if (!EMAIL.test(email) || email.length > 200) return { error: "Please enter a valid email address." };
  if (message.length < 5 || message.length > 4000) return { error: "Please write a short message (up to 4,000 characters)." };
  const typeLabel = site.inquiryTypes.find((t) => t.id === type)?.label ?? "General question";

  const { error } = await db().from("contact_messages").insert({ name, email, type: typeLabel, message });
  if (error) return { error: "Sorry, we couldn't send that. Please try again." };

  const to = process.env.CONTACT_EMAIL;
  if (to) {
    await sendEmail(to, `New inquiry: ${typeLabel}`,
      `<p><b>${esc(name)}</b> (${esc(email)}) wrote about <b>${esc(typeLabel)}</b>:</p><p style="white-space:pre-wrap">${esc(message)}</p>`)
      .catch((e) => console.error("inquiry email failed", e));
  }
  return { ok: true };
}

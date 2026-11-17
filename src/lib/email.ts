import { Resend } from "resend";
import { db } from "@/lib/supabase/admin";
import { SITE_NAME, siteUrl, dateTime, money } from "@/lib/format";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function shell(body: string) {
  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
<h2 style="margin:0 0 16px;color:#4f46e5">${esc(SITE_NAME)}</h2>${body}</div>`;
}

export async function sendEmail(to: string | string[], subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("RESEND_API_KEY not set; email not sent:", subject);
    return;
  }
  const from = process.env.EMAIL_FROM || "Events <onboarding@resend.dev>";
  const { error } = await new Resend(key).emails.send({ from, to, subject, html });
  if (error) throw new Error(error.message);
}

export async function sendTicketEmail(orderId: string) {
  const supabase = db();
  const { data: order } = await supabase.from("orders").select("*, events(title, starts_at, location, address)").eq("id", orderId).single();
  if (!order) return;
  const { count } = await supabase.from("tickets").select("id", { count: "exact", head: true }).eq("order_id", orderId);
  const ev = order.events as { title: string; starts_at: string; location: string | null; address: string | null };
  const link = `${siteUrl()}/orders/${order.token}`;
  await sendEmail(
    order.buyer_email,
    `Your tickets for ${ev.title}`,
    shell(`<p>Hi ${esc(order.buyer_name)},</p>
<p>You're in! Here are your ${count} ticket${count === 1 ? "" : "s"} for <b>${esc(ev.title)}</b>.</p>
<p>${esc(dateTime(ev.starts_at))}<br>${esc([ev.location, ev.address].filter(Boolean).join(", "))}</p>
<p><a href="${link}" style="background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">View my tickets (QR code)</a></p>
<p style="color:#555">Show the QR code at the door. Total paid: ${money(order.total_cents)}.</p>`),
  );
}

export async function sendWaitlistEmail(to: string[], eventTitle: string, eventUrl: string) {
  for (const email of to) {
    await sendEmail(email, `Tickets may be available: ${eventTitle}`,
      shell(`<p>Good news, spots may have opened up for <b>${esc(eventTitle)}</b>.</p>
<p><a href="${eventUrl}">Get your tickets</a> before they go again.</p>`));
  }
}

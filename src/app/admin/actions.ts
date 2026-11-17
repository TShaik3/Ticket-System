"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { localInputToIso, slugify, siteUrl } from "@/lib/format";
import { sendTicketEmail, sendWaitlistEmail } from "@/lib/email";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const optStr = (fd: FormData, k: string) => str(fd, k) || null;
const optInt = (fd: FormData, k: string) => { const v = str(fd, k); return v === "" ? null : Math.max(0, Math.round(Number(v))); };
const cents = (fd: FormData, k: string) => Math.max(0, Math.round(Number(str(fd, k) || 0) * 100));

export async function saveEvent(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const title = str(fd, "title");
  const startsAt = localInputToIso(str(fd, "starts_at"));
  if (!title || !startsAt) redirect(id ? `/admin/events/${id}?error=Title+and+start+time+are+required` : "/admin/events/new?error=Title+and+start+time+are+required");
  const row = {
    title,
    slug: slugify(str(fd, "slug") || title),
    description: optStr(fd, "description"),
    location: optStr(fd, "location"),
    address: optStr(fd, "address"),
    starts_at: startsAt,
    ends_at: localInputToIso(str(fd, "ends_at")),
    image_url: optStr(fd, "image_url"),
    capacity: optInt(fd, "capacity"),
    status: ["draft", "published", "closed"].includes(str(fd, "status")) ? str(fd, "status") : "draft",
  };
  const supabase = db();
  const res = id ? await supabase.from("events").update(row).eq("id", id).select("id").single()
    : await supabase.from("events").insert(row).select("id").single();
  if (res.error) {
    const msg = res.error.code === "23505" ? "That URL slug is already used by another event." : "Could not save the event.";
    redirect(id ? `/admin/events/${id}?error=${encodeURIComponent(msg)}` : `/admin/events/new?error=${encodeURIComponent(msg)}`);
  }
  revalidatePath("/");
  redirect(`/admin/events/${res.data!.id}?saved=1`);
}

export async function addTicketType(fd: FormData) {
  await requireAdmin();
  const eventId = str(fd, "event_id");
  await db().from("ticket_types").insert({
    event_id: eventId,
    name: str(fd, "name") || "General admission",
    description: optStr(fd, "description"),
    price_cents: cents(fd, "price"),
    quantity_total: optInt(fd, "quantity_total") ?? 0,
    max_per_order: optInt(fd, "max_per_order") || 4,
    sale_start: localInputToIso(str(fd, "sale_start")),
    sale_end: localInputToIso(str(fd, "sale_end")),
  });
  revalidatePath(`/admin/events/${eventId}`);
}

export async function toggleTicketType(fd: FormData) {
  await requireAdmin();
  const eventId = str(fd, "event_id");
  await db().from("ticket_types").update({ active: str(fd, "active") !== "true" }).eq("id", str(fd, "id"));
  revalidatePath(`/admin/events/${eventId}`);
}

export async function addPromo(fd: FormData) {
  await requireAdmin();
  const eventId = str(fd, "event_id");
  const pct = optInt(fd, "percent_off");
  const amt = Math.round(Number(str(fd, "amount_off") || 0) * 100);
  if (!str(fd, "code") || (!pct && !amt)) redirect(`/admin/events/${eventId}?error=Promo+needs+a+code+and+a+discount`);
  const { error } = await db().from("promo_codes").insert({
    event_id: eventId,
    code: str(fd, "code").toUpperCase(),
    percent_off: pct && pct <= 100 ? pct : null,
    amount_off_cents: !pct && amt > 0 ? amt : null,
    usage_limit: optInt(fd, "usage_limit"),
    expires_at: localInputToIso(str(fd, "expires_at")),
  });
  if (error) redirect(`/admin/events/${eventId}?error=Could+not+add+promo+(is+the+code+already+used%3F)`);
  revalidatePath(`/admin/events/${eventId}`);
}

export async function togglePromo(fd: FormData) {
  await requireAdmin();
  const eventId = str(fd, "event_id");
  await db().from("promo_codes").update({ active: str(fd, "active") !== "true" }).eq("id", str(fd, "id"));
  revalidatePath(`/admin/events/${eventId}`);
}

export async function addSponsor(fd: FormData) {
  await requireAdmin();
  const eventId = str(fd, "event_id");
  await db().from("sponsors").insert({ event_id: eventId, name: str(fd, "name"), logo_url: optStr(fd, "logo_url"), link_url: optStr(fd, "link_url") });
  revalidatePath(`/admin/events/${eventId}`);
}

export async function deleteSponsor(fd: FormData) {
  await requireAdmin();
  await db().from("sponsors").delete().eq("id", str(fd, "id"));
  revalidatePath(`/admin/events/${str(fd, "event_id")}`);
}

export async function notifyWaitlist(fd: FormData) {
  await requireAdmin();
  const eventId = str(fd, "event_id");
  const supabase = db();
  const { data: event } = await supabase.from("events").select("title, slug").eq("id", eventId).single();
  const { data: people } = await supabase.from("waitlist").select("id, email").eq("event_id", eventId).is("notified_at", null);
  if (event && people?.length) {
    await sendWaitlistEmail(people.map((p) => p.email), event.title, `${siteUrl()}/events/${event.slug}`);
    await supabase.from("waitlist").update({ notified_at: new Date().toISOString() }).in("id", people.map((p) => p.id));
  }
  redirect(`/admin/events/${eventId}?saved=1`);
}

export async function checkInTicket(fd: FormData) {
  await requireAdmin({ allowStaff: true });
  const undo = str(fd, "undo") === "1";
  await db().from("tickets")
    .update(undo ? { status: "valid", checked_in_at: null } : { status: "used", checked_in_at: new Date().toISOString() })
    .eq("id", str(fd, "ticket_id")).eq("status", undo ? "used" : "valid");
  revalidatePath(`/admin/events/${str(fd, "event_id")}/guests`);
}

export async function resendTickets(fd: FormData) {
  await requireAdmin();
  await sendTicketEmail(str(fd, "order_id"));
  redirect(`/admin/events/${str(fd, "event_id")}/guests?sent=1`);
}

/** Refunds require a written reason (policy: refunds only for an approved reason). */
export async function refundOrder(fd: FormData) {
  await requireAdmin();
  const eventId = str(fd, "event_id");
  const orderId = str(fd, "order_id");
  const reason = str(fd, "reason");
  if (reason.length < 3) redirect(`/admin/events/${eventId}/guests?error=A+reason+is+required+to+refund`);
  const supabase = db();
  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (!order || order.status !== "paid") redirect(`/admin/events/${eventId}/guests?error=Order+cannot+be+refunded`);
  if (order!.total_cents > 0) {
    if (!order!.stripe_payment_intent) redirect(`/admin/events/${eventId}/guests?error=No+Stripe+payment+found+for+this+order`);
    try {
      await stripe().refunds.create({ payment_intent: order!.stripe_payment_intent!, metadata: { order_id: orderId, reason } }, { idempotencyKey: `refund-${orderId}` });
    } catch (e) {
      console.error("refund failed", e);
      redirect(`/admin/events/${eventId}/guests?error=Stripe+refund+failed`);
    }
  }
  await supabase.from("orders").update({ status: "refunded", refund_reason: reason }).eq("id", orderId);
  await supabase.from("tickets").update({ status: "cancelled" }).eq("order_id", orderId);
  revalidatePath(`/admin/events/${eventId}/guests`);
  redirect(`/admin/events/${eventId}/guests?refunded=1`);
}

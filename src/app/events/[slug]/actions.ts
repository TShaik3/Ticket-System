"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { siteUrl } from "@/lib/format";
import { finalizeOrder, cancelPendingOrder } from "@/lib/orders";

export type FormState = { error?: string; ok?: string };

const ERRORS: Record<string, string> = {
  sold_out: "Sorry, there aren't enough tickets left. Try fewer tickets or join the waitlist.",
  event_closed: "Ticket sales for this event are closed.",
  sale_not_open: "Tickets for this type aren't on sale yet.",
  sale_ended: "Sales for this ticket type have ended.",
  bad_quantity: "Please choose a valid number of tickets.",
  invalid_promo: "That promo code isn't valid.",
  ticket_type_not_found: "That ticket type isn't available.",
};
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function checkout(_prev: FormState, fd: FormData): Promise<FormState> {
  const slug = String(fd.get("slug") ?? "");
  const ticketTypeId = String(fd.get("ticket_type_id") ?? "");
  const qty = Number(fd.get("quantity") ?? 1);
  const name = String(fd.get("name") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const promo = String(fd.get("promo") ?? "").trim();

  if (!ticketTypeId) return { error: "Please choose a ticket type." };
  if (!name || name.length > 120) return { error: "Please enter your name." };
  if (!EMAIL.test(email) || email.length > 200) return { error: "Please enter a valid email address." };
  if (!Number.isInteger(qty) || qty < 1) return { error: "Please choose a valid number of tickets." };

  const supabase = db();
  const expiresAt = new Date(Date.now() + 31 * 60 * 1000); // Stripe's minimum session life is 30 min
  const { data: orderId, error } = await supabase.rpc("create_pending_order", {
    p_ticket_type_id: ticketTypeId,
    p_qty: qty,
    p_name: name,
    p_email: email,
    p_promo: promo || null,
    p_expires_at: expiresAt.toISOString(),
  });
  if (error || !orderId) {
    const key = Object.keys(ERRORS).find((k) => error?.message.includes(k));
    if (!key) console.error("create_pending_order failed", error);
    return { error: key ? ERRORS[key] : "Something went wrong. Please try again." };
  }

  const { data: order } = await supabase.from("orders").select("*, events(title)").eq("id", orderId).single();
  if (!order) return { error: "Something went wrong. Please try again." };

  if (order.total_cents === 0) {
    await finalizeOrder(order.id);
    redirect(`/orders/${order.token}`);
  }

  let url: string | null = null;
  try {
    const title = (order.events as { title: string }).title;
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: order.total_cents,
            product_data: { name: `${title}: ${qty} ticket${qty === 1 ? "" : "s"}` },
          },
        },
      ],
      metadata: { order_id: order.id },
      payment_intent_data: { metadata: { order_id: order.id } },
      success_url: `${siteUrl()}/orders/${order.token}?paid=1`,
      cancel_url: `${siteUrl()}/events/${slug}`,
    });
    await supabase.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);
    url = session.url;
  } catch (e) {
    console.error("stripe session failed", e);
    await cancelPendingOrder(order.id);
    return { error: "We couldn't start the payment. Please try again." };
  }
  if (!url) {
    await cancelPendingOrder(order.id);
    return { error: "We couldn't start the payment. Please try again." };
  }
  redirect(url);
}

export async function joinWaitlist(_prev: FormState, fd: FormData): Promise<FormState> {
  const eventId = String(fd.get("event_id") ?? "");
  const name = String(fd.get("name") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const quantity = Math.min(Math.max(Number(fd.get("quantity") ?? 1) || 1, 1), 10);
  if (!name || !EMAIL.test(email)) return { error: "Please enter your name and a valid email." };
  const { error } = await db().from("waitlist").insert({ event_id: eventId, name, email, quantity });
  if (error) return { error: "Couldn't join the waitlist. Please try again." };
  return { ok: "You're on the waitlist! We'll email you if spots open up." };
}

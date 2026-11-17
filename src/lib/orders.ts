import { db } from "@/lib/supabase/admin";
import { sendTicketEmail } from "@/lib/email";

/** Marks an order paid and emails tickets. Safe to call more than once (idempotent). */
export async function finalizeOrder(orderId: string, paymentIntent?: string | null) {
  const supabase = db();
  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (!order) return;
  if (order.status === "paid") return;
  if (order.status === "cancelled" || order.status === "refunded") {
    // Payment arrived for an order we had already released; flag for a manual refund.
    console.error("Payment received for non-pending order", orderId, order.status);
    return;
  }
  // Only the call that flips pending -> paid sends the email.
  const { data: updated } = await supabase
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString(), stripe_payment_intent: paymentIntent ?? null })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("id");
  if (!updated?.length) return;
  await supabase.from("tickets").update({ status: "valid" }).eq("order_id", orderId).eq("status", "pending");
  await sendTicketEmail(orderId).catch((e) => console.error("email failed", e));
}

/** Releases held seats (e.g. Stripe session expired or checkout failed). */
export async function cancelPendingOrder(orderId: string) {
  const supabase = db();
  const { data: updated } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("promo_code_id");
  if (!updated?.length) return;
  await supabase.from("tickets").update({ status: "cancelled" }).eq("order_id", orderId);
  const promo = updated[0].promo_code_id;
  if (promo) {
    const { data: p } = await supabase.from("promo_codes").select("used_count").eq("id", promo).single();
    if (p && p.used_count > 0) await supabase.from("promo_codes").update({ used_count: p.used_count - 1 }).eq("id", promo);
  }
}

import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { finalizeOrder, cancelPendingOrder } from "@/lib/orders";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = request.headers.get("stripe-signature");
  if (!secret || !sig) return new Response("Missing signature", { status: 400 });

  const body = await request.text(); // raw body is required for signature checks
  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(body, sig, secret, undefined, Stripe.createSubtleCryptoProvider());
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.payment_status === "paid" && s.metadata?.order_id) {
        await finalizeOrder(s.metadata.order_id, typeof s.payment_intent === "string" ? s.payment_intent : null);
      }
    } else if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.metadata?.order_id) await cancelPendingOrder(s.metadata.order_id);
    }
  } catch (e) {
    console.error("webhook handler failed", e);
    return new Response("Handler error", { status: 500 }); // Stripe will retry
  }
  return new Response("ok");
}

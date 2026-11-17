"use client";

import { useActionState, useState } from "react";
import { checkout, joinWaitlist, type FormState } from "@/app/events/[slug]/actions";

export type TicketOption = {
  id: string; name: string; description: string | null; price_cents: number;
  left: number; max_per_order: number; state: "available" | "soldout" | "notopen" | "ended";
};

const usd = (c: number) => (c === 0 ? "Free" : `$${(c / 100).toFixed(2)}`);

export default function TicketForm({ slug, eventId, options }: { slug: string; eventId: string; options: TicketOption[] }) {
  const firstAvail = options.find((o) => o.state === "available");
  const [selected, setSelected] = useState(firstAvail?.id ?? "");
  const [qty, setQty] = useState(1);
  const [state, action, pending] = useActionState<FormState, FormData>(checkout, {});
  const [wState, wAction, wPending] = useActionState<FormState, FormData>(joinWaitlist, {});
  const sel = options.find((o) => o.id === selected);
  const maxQty = sel ? Math.min(sel.max_per_order, sel.left) : 1;
  const allSoldOut = options.length > 0 && options.every((o) => o.state === "soldout");

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {options.map((o) => (
          <label key={o.id} className={`card flex cursor-pointer items-start gap-3 ${selected === o.id ? "border-brand" : ""} ${o.state !== "available" ? "opacity-60" : ""}`}>
            <input type="radio" name="_pick" className="mt-1" disabled={o.state !== "available"} checked={selected === o.id}
              onChange={() => { setSelected(o.id); setQty(1); }} />
            <div className="flex-1">
              <div className="flex justify-between font-semibold"><span>{o.name}</span><span>{usd(o.price_cents)}</span></div>
              {o.description && <p className="text-sm text-muted">{o.description}</p>}
              <p className="text-xs text-muted">
                {o.state === "soldout" ? "Sold out" : o.state === "notopen" ? "Not on sale yet" : o.state === "ended" ? "Sales ended"
                  : o.left <= 10 ? `Only ${o.left} left` : ""}
              </p>
            </div>
          </label>
        ))}
      </div>

      {sel && sel.state === "available" && (
        <form action={action} className="card space-y-4">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="ticket_type_id" value={selected} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="name">Your name</label><input id="name" name="name" required className="input" autoComplete="name" /></div>
            <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required className="input" autoComplete="email" /></div>
            <div>
              <label className="label" htmlFor="quantity">Tickets</label>
              <select id="quantity" name="quantity" className="input" value={qty} onChange={(e) => setQty(Number(e.target.value))}>
                {Array.from({ length: Math.max(maxQty, 1) }, (_, i) => i + 1).map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div><label className="label" htmlFor="promo">Promo code (optional)</label><input id="promo" name="promo" className="input" autoComplete="off" /></div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Subtotal: <b className="text-foreground">{usd(sel.price_cents * qty)}</b></span>
            <button className="btn" disabled={pending}>{pending ? "Please wait…" : sel.price_cents === 0 ? "Get free ticket" : "Continue to payment"}</button>
          </div>
          {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
        </form>
      )}

      {allSoldOut && (
        <form action={wAction} className="card space-y-3">
          <h3 className="font-semibold">Sold out? Join the waitlist</h3>
          <input type="hidden" name="event_id" value={eventId} />
          <div className="grid gap-3 sm:grid-cols-3">
            <input name="name" placeholder="Name" required className="input" />
            <input name="email" type="email" placeholder="Email" required className="input" />
            <input name="quantity" type="number" min={1} max={10} defaultValue={1} className="input" aria-label="Tickets wanted" />
          </div>
          <button className="btn" disabled={wPending}>Join waitlist</button>
          {wState.error && <p className="text-sm text-red-600">{wState.error}</p>}
          {wState.ok && <p className="text-sm text-green-600">{wState.ok}</p>}
        </form>
      )}
    </div>
  );
}

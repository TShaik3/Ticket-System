import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { taken } from "@/lib/events";
import { money, siteUrl } from "@/lib/format";
import EventForm from "@/components/EventForm";
import {
  addTicketType, toggleTicketType, addPromo, togglePromo, addSponsor, deleteSponsor, notifyWaitlist,
} from "@/app/admin/actions";

export default async function ManageEvent({ params, searchParams }: PageProps<"/admin/events/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const supabase = db();
  const { data: event } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!event) notFound();
  const [{ data: types }, { data: promos }, { data: sponsors }, { data: waitlist }, t] = await Promise.all([
    supabase.from("ticket_types").select("*").eq("event_id", id).order("sort").order("price_cents"),
    supabase.from("promo_codes").select("*").eq("event_id", id).order("code"),
    supabase.from("sponsors").select("*").eq("event_id", id).order("sort"),
    supabase.from("waitlist").select("*").eq("event_id", id).order("created_at"),
    taken(id),
  ]);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <div className="flex gap-3 text-sm">
          <Link className="underline" href={`/admin/events/${id}/guests`}>Guest list &amp; orders</Link>
          {event.status === "published" && <Link className="underline" href={`/events/${event.slug}`}>View public page</Link>}
        </div>
      </div>
      {sp.saved && <p className="text-green-600">Saved.</p>}
      {sp.error && <p role="alert" className="text-red-600">{sp.error}</p>}
      <p className="text-sm text-muted">Public link: {siteUrl()}/events/{event.slug} · {t.total} seats taken{event.capacity != null ? ` of ${event.capacity}` : ""}</p>

      <section><h2 className="mb-2 text-lg font-semibold">Details</h2><EventForm event={event} /></section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Ticket types</h2>
        <table className="table mb-4">
          <thead><tr><th>Name</th><th>Price</th><th>Sold / total</th><th>Max/order</th><th></th></tr></thead>
          <tbody>
            {types?.map((tt) => (
              <tr key={tt.id} className={tt.active ? "" : "opacity-50"}>
                <td>{tt.name}</td><td>{money(tt.price_cents)}</td><td>{t.byType[tt.id] ?? 0} / {tt.quantity_total}</td><td>{tt.max_per_order}</td>
                <td>
                  <form action={toggleTicketType}>
                    <input type="hidden" name="id" value={tt.id} /><input type="hidden" name="event_id" value={id} /><input type="hidden" name="active" value={String(tt.active)} />
                    <button className="underline">{tt.active ? "Deactivate" : "Activate"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <form action={addTicketType} className="card grid gap-3 sm:grid-cols-3">
          <input type="hidden" name="event_id" value={id} />
          <input name="name" placeholder="Name (e.g. General, VIP, Early bird)" required className="input sm:col-span-2" />
          <input name="price" type="number" step="0.01" min={0} placeholder="Price in $ (0 = free)" required className="input" />
          <input name="quantity_total" type="number" min={0} placeholder="Quantity available" required className="input" />
          <input name="max_per_order" type="number" min={1} placeholder="Max per order (4)" className="input" />
          <input name="description" placeholder="Description (optional)" className="input" />
          <div><label className="label">Sale starts (optional)</label><input type="datetime-local" name="sale_start" className="input" /></div>
          <div><label className="label">Sale ends (optional)</label><input type="datetime-local" name="sale_end" className="input" /></div>
          <div className="flex items-end"><button className="btn w-full">Add ticket type</button></div>
        </form>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Promo codes</h2>
        <table className="table mb-4">
          <thead><tr><th>Code</th><th>Discount</th><th>Used</th><th></th></tr></thead>
          <tbody>
            {promos?.map((p) => (
              <tr key={p.id} className={p.active ? "" : "opacity-50"}>
                <td className="font-mono">{p.code}</td>
                <td>{p.percent_off ? `${p.percent_off}% off` : `${money(p.amount_off_cents ?? 0)} off`}</td>
                <td>{p.used_count}{p.usage_limit ? ` / ${p.usage_limit}` : ""}</td>
                <td>
                  <form action={togglePromo}>
                    <input type="hidden" name="id" value={p.id} /><input type="hidden" name="event_id" value={id} /><input type="hidden" name="active" value={String(p.active)} />
                    <button className="underline">{p.active ? "Disable" : "Enable"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <form action={addPromo} className="card grid gap-3 sm:grid-cols-4">
          <input type="hidden" name="event_id" value={id} />
          <input name="code" placeholder="CODE" required className="input" />
          <input name="percent_off" type="number" min={1} max={100} placeholder="% off" className="input" />
          <input name="amount_off" type="number" step="0.01" min={0} placeholder="or $ off" className="input" />
          <input name="usage_limit" type="number" min={1} placeholder="Max uses" className="input" />
          <div className="sm:col-span-3"><label className="label">Expires (optional)</label><input type="datetime-local" name="expires_at" className="input" /></div>
          <div className="flex items-end"><button className="btn w-full">Add promo</button></div>
        </form>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Sponsors</h2>
        <ul className="mb-4 space-y-1">
          {sponsors?.map((s) => (
            <li key={s.id} className="flex items-center gap-3">
              <span>{s.name}</span>
              <form action={deleteSponsor}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="event_id" value={id} /><button className="text-sm text-red-600 underline">Remove</button></form>
            </li>
          ))}
        </ul>
        <form action={addSponsor} className="card grid gap-3 sm:grid-cols-4">
          <input type="hidden" name="event_id" value={id} />
          <input name="name" placeholder="Sponsor name" required className="input" />
          <input name="logo_url" placeholder="Logo URL (optional)" className="input" />
          <input name="link_url" placeholder="Website (optional)" className="input" />
          <button className="btn">Add sponsor</button>
        </form>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Waitlist ({waitlist?.length ?? 0})</h2>
        {waitlist?.length ? (
          <>
            <table className="table mb-4">
              <thead><tr><th>Name</th><th>Email</th><th>Wants</th><th>Notified</th></tr></thead>
              <tbody>{waitlist.map((w) => <tr key={w.id}><td>{w.name}</td><td>{w.email}</td><td>{w.quantity}</td><td>{w.notified_at ? "Yes" : "No"}</td></tr>)}</tbody>
            </table>
            <form action={notifyWaitlist}><input type="hidden" name="event_id" value={id} /><button className="btn">Email everyone not yet notified</button></form>
          </>
        ) : <p className="text-muted">Nobody on the waitlist.</p>}
      </section>
    </div>
  );
}

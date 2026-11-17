import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { money, dateTime } from "@/lib/format";
import { checkInTicket, refundOrder, resendTickets } from "@/app/admin/actions";
import PrintButton from "@/components/PrintButton";

export default async function Guests({ params, searchParams }: PageProps<"/admin/events/[id]/guests">) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const supabase = db();
  const { data: event } = await supabase.from("events").select("id, title, starts_at").eq("id", id).maybeSingle();
  if (!event) notFound();
  const [{ data: tickets }, { data: orders }, { data: types }] = await Promise.all([
    supabase.from("tickets").select("*").eq("event_id", id),
    supabase.from("orders").select("*").eq("event_id", id).order("created_at", { ascending: false }),
    supabase.from("ticket_types").select("id, name").eq("event_id", id),
  ]);
  const typeName = Object.fromEntries((types ?? []).map((t) => [t.id, t.name]));
  const orderById = Object.fromEntries((orders ?? []).map((o) => [o.id, o]));
  const guests = (tickets ?? [])
    .filter((t) => orderById[t.order_id]?.status === "paid" && t.status !== "cancelled")
    .sort((a, b) => a.attendee_name.localeCompare(b.attendee_name));
  const paidOrders = (orders ?? []).filter((o) => o.status === "paid");
  const revenue = paidOrders.reduce((s, o) => s + o.total_cents, 0);
  const checkedIn = guests.filter((g) => g.status === "used").length;

  return (
    <div className="space-y-8">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{event.title}: guests</h1>
        <div className="flex gap-2">
          <Link className="btn btn-ghost" href={`/admin/events/${id}`}>Back to event</Link>
          <a className="btn btn-ghost" href={`/admin/events/${id}/guests.csv`}>Export CSV</a>
          <PrintButton label="Print guest list" />
        </div>
      </div>
      {sp.error && <p role="alert" className="text-red-600">{sp.error}</p>}
      {sp.refunded && <p className="text-green-600">Order refunded.</p>}
      {sp.sent && <p className="text-green-600">Tickets re-sent.</p>}

      <p className="text-sm text-muted">{dateTime(event.starts_at)} · {guests.length} tickets · {checkedIn} checked in · Revenue {money(revenue)}</p>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Guest list</h2>
        <table className="table">
          <thead><tr><th>✓</th><th>Name</th><th>Ticket</th><th>Buyer email</th><th>Code</th><th className="no-print"></th></tr></thead>
          <tbody>
            {guests.map((g) => (
              <tr key={g.id}>
                <td>{g.status === "used" ? "✔" : "☐"}</td>
                <td>{g.attendee_name}</td>
                <td>{typeName[g.ticket_type_id]}</td>
                <td>{orderById[g.order_id]?.buyer_email}</td>
                <td className="font-mono text-xs">{g.code.slice(0, 8).toUpperCase()}</td>
                <td className="no-print">
                  <form action={checkInTicket}>
                    <input type="hidden" name="ticket_id" value={g.id} /><input type="hidden" name="event_id" value={id} />
                    {g.status === "used" ? <><input type="hidden" name="undo" value="1" /><button className="underline">Undo</button></> : <button className="btn py-1">Check in</button>}
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!guests.length && <p className="mt-2 text-muted">No tickets sold yet.</p>}
      </section>

      <section className="no-print">
        <h2 className="mb-2 text-lg font-semibold">Orders</h2>
        <div className="space-y-3">
          {orders?.map((o) => (
            <div key={o.id} className="card text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <span><b>{o.buyer_name}</b> · {o.buyer_email}</span>
                <span>{money(o.total_cents)} · <b>{o.status}</b></span>
              </div>
              {o.refund_reason && <p className="text-muted">Refund reason: {o.refund_reason}</p>}
              {o.status === "paid" && (
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <form action={resendTickets}><input type="hidden" name="order_id" value={o.id} /><input type="hidden" name="event_id" value={id} /><button className="underline">Resend email</button></form>
                  <form action={refundOrder} className="flex gap-2">
                    <input type="hidden" name="order_id" value={o.id} /><input type="hidden" name="event_id" value={id} />
                    <input name="reason" required minLength={3} placeholder="Approved reason for refund" className="input w-64" />
                    <button className="btn btn-danger">Refund</button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

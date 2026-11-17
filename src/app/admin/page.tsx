import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { shortDate } from "@/lib/format";

export default async function AdminHome() {
  await requireAdmin();
  const supabase = db();
  const { data: events } = await supabase.from("events").select("id, title, status, starts_at").order("starts_at", { ascending: false });
  const { data: paid } = await supabase.from("tickets").select("event_id, orders!inner(status)").in("status", ["valid", "used"]);
  const sold: Record<string, number> = {};
  paid?.forEach((t) => { sold[t.event_id] = (sold[t.event_id] ?? 0) + 1; });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
        <Link href="/admin/events/new" className="btn">New event</Link>
      </div>
      <table className="table">
        <thead><tr><th>Event</th><th>Date</th><th>Status</th><th>Tickets</th><th></th></tr></thead>
        <tbody>
          {events?.map((e) => (
            <tr key={e.id}>
              <td><Link href={`/admin/events/${e.id}`} className="font-semibold underline">{e.title}</Link></td>
              <td>{shortDate(e.starts_at)}</td>
              <td>{e.status}</td>
              <td>{sold[e.id] ?? 0}</td>
              <td><Link href={`/admin/events/${e.id}/guests`} className="underline">Guest list</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
      {!events?.length && <p className="mt-4 text-muted">No events yet. Create your first one.</p>}
    </div>
  );
}

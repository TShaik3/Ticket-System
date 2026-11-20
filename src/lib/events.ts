import { db } from "@/lib/supabase/admin";

/** Seats currently taken per ticket type (paid + unexpired pending holds) and for the whole event. */
export async function taken(eventId: string) {
  const { data } = await db()
    .from("tickets")
    .select("ticket_type_id, status, orders!inner(status, expires_at)")
    .eq("event_id", eventId)
    .neq("status", "cancelled");
  const now = Date.now();
  const byType: Record<string, number> = {};
  let total = 0;
  for (const t of data ?? []) {
    const o = t.orders as unknown as { status: string; expires_at: string | null };
    const holds = o.status === "paid" || (o.status === "pending" && o.expires_at && new Date(o.expires_at).getTime() > now);
    if (!holds) continue;
    byType[t.ticket_type_id] = (byType[t.ticket_type_id] ?? 0) + 1;
    total++;
  }
  return { byType, total };
}

export async function getPublicEvent(slug: string) {
  const supabase = db();
  const { data: event } = await supabase.from("events").select("*").eq("slug", slug).in("status", ["published", "closed"]).maybeSingle();
  if (!event) return null;
  const [{ data: types }, { data: sponsors }, t] = await Promise.all([
    supabase.from("ticket_types").select("*").eq("event_id", event.id).eq("active", true).order("sort").order("price_cents"),
    supabase.from("sponsors").select("*").eq("event_id", event.id).order("sort"),
    taken(event.id),
  ]);
  const eventLeft = event.capacity == null ? Infinity : Math.max(event.capacity - t.total, 0);
  const ticketTypes = (types ?? []).map((tt) => ({
    ...tt,
    left: Math.max(Math.min(tt.quantity_total - (t.byType[tt.id] ?? 0), eventLeft), 0),
  }));
  return { event, ticketTypes, sponsors: sponsors ?? [] };
}

/** Upcoming published events with a capacity label, for the landing page. */
export async function getUpcomingEvents(sinceIso: string) {
  const supabase = db();
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .gte("starts_at", sinceIso)
    .order("starts_at");
  if (!events?.length) return [];
  const ids = events.map((e) => e.id);
  const [{ data: types }, { data: sponsors }, counts] = await Promise.all([
    supabase.from("ticket_types").select("event_id, quantity_total").in("event_id", ids).eq("active", true),
    supabase.from("sponsors").select("event_id, name, logo_url, link_url").in("event_id", ids).order("sort"),
    Promise.all(events.map((e) => taken(e.id))),
  ]);
  return events.map((e, i) => {
    const typeTotal = (types ?? []).filter((t) => t.event_id === e.id).reduce((s, t) => s + t.quantity_total, 0);
    const cap = e.capacity ?? (typeTotal || null);
    const left = cap == null ? null : Math.max(cap - counts[i].total, 0);
    return { ...e, cap, left, sponsors: (sponsors ?? []).filter((s) => s.event_id === e.id) };
  });
}

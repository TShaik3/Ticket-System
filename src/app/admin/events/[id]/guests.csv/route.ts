import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";

// Prefix risky leading characters so spreadsheets don't run guest-entered text as a formula.
const cell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(_req: Request, ctx: RouteContext<"/admin/events/[id]/guests.csv">) {
  const admin = await getAdmin();
  if (!admin || admin.role === "staff") return new Response("Unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const supabase = db();
  const [{ data: tickets }, { data: orders }, { data: types }] = await Promise.all([
    supabase.from("tickets").select("*").eq("event_id", id),
    supabase.from("orders").select("*").eq("event_id", id),
    supabase.from("ticket_types").select("id, name").eq("event_id", id),
  ]);
  const o = Object.fromEntries((orders ?? []).map((x) => [x.id, x]));
  const tn = Object.fromEntries((types ?? []).map((x) => [x.id, x.name]));
  const rows = [["Attendee", "Ticket type", "Buyer", "Email", "Ticket status", "Order status", "Code", "Checked in at"]];
  for (const t of tickets ?? []) {
    const ord = o[t.order_id];
    rows.push([t.attendee_name, tn[t.ticket_type_id], ord?.buyer_name, ord?.buyer_email, t.status, ord?.status, t.code, t.checked_in_at ?? ""]);
  }
  return new Response(rows.map((r) => r.map(cell).join(",")).join("\n"), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="guests.csv"' },
  });
}

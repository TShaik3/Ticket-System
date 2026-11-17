import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";

type Body = { code?: string; ticketId?: string; eventId?: string; undo?: boolean };

export async function POST(request: Request) {
  if (!(await getAdmin())) return Response.json({ status: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Body;
  const supabase = db();

  let q = supabase.from("tickets").select("id, code, status, event_id, attendee_name, checked_in_at, ticket_type_id, order_id");
  if (body.ticketId) q = q.eq("id", body.ticketId);
  else if (body.code) q = q.eq("code", body.code.trim());
  else return Response.json({ status: "invalid" }, { status: 400 });
  const { data: t } = await q.maybeSingle();
  if (!t) return Response.json({ status: "invalid" });
  if (body.eventId && t.event_id !== body.eventId) return Response.json({ status: "wrong_event" });

  const [{ data: type }, { data: order }] = await Promise.all([
    supabase.from("ticket_types").select("name").eq("id", t.ticket_type_id).single(),
    supabase.from("orders").select("buyer_name, status").eq("id", t.order_id).single(),
  ]);
  const info = { name: t.attendee_name, buyer: order?.buyer_name, ticketType: type?.name };

  if (body.undo) {
    await supabase.from("tickets").update({ status: "valid", checked_in_at: null }).eq("id", t.id).eq("status", "used");
    return Response.json({ status: "undone", ...info });
  }
  if (t.status === "cancelled" || order?.status !== "paid") return Response.json({ status: "cancelled", ...info });

  // Atomic: only one scan can flip valid -> used.
  const { data: flipped } = await supabase
    .from("tickets")
    .update({ status: "used", checked_in_at: new Date().toISOString() })
    .eq("id", t.id)
    .eq("status", "valid")
    .select("id");
  if (!flipped?.length) return Response.json({ status: "already_used", at: t.checked_in_at, ...info });
  return Response.json({ status: "ok", ...info });
}

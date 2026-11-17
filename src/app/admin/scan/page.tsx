import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { hoursAgoIso } from "@/lib/format";
import Scanner from "@/components/Scanner";

export default async function ScanPage() {
  await requireAdmin({ allowStaff: true });
  const { data } = await db()
    .from("events")
    .select("id, title, starts_at")
    .in("status", ["published", "closed"])
    .gte("starts_at", hoursAgoIso(24))
    .order("starts_at")
    .limit(10);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Scan tickets</h1>
      <Scanner events={(data ?? []).map((e) => ({ id: e.id, title: e.title }))} />
    </div>
  );
}

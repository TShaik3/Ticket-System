import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { shortDate } from "@/lib/format";
import { toggleInquiry } from "@/app/admin/actions";

export default async function Inquiries() {
  await requireAdmin();
  const { data } = await db().from("contact_messages").select("*").order("created_at", { ascending: false }).limit(200);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Inquiries</h1>
      {!data?.length && <p className="text-muted">No messages yet.</p>}
      {data?.map((m) => (
        <div key={m.id} className={`card ${m.handled ? "opacity-60" : ""}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span><b>{m.name}</b> · <a className="underline" href={`mailto:${m.email}`}>{m.email}</a></span>
            <span className="text-muted">{m.type} · {shortDate(m.created_at)}</span>
          </div>
          <p className="mt-3 whitespace-pre-wrap">{m.message}</p>
          <form action={toggleInquiry} className="mt-3">
            <input type="hidden" name="id" value={m.id} /><input type="hidden" name="handled" value={String(m.handled)} />
            <button className="btn btn-ghost btn-sm">{m.handled ? "Mark as new" : "Mark as handled"}</button>
          </form>
        </div>
      ))}
    </div>
  );
}

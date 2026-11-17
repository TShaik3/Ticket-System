import Link from "next/link";
import { db } from "@/lib/supabase/admin";
import { dateTime, hoursAgoIso } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: events } = await db()
    .from("events")
    .select("id, slug, title, starts_at, location, image_url, status")
    .eq("status", "published")
    .gte("starts_at", hoursAgoIso(6))
    .order("starts_at");

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Upcoming events</h1>
      {!events?.length && <p className="text-muted">No upcoming events right now. Check back soon!</p>}
      <div className="grid gap-4">
        {events?.map((e) => (
          <Link key={e.id} href={`/events/${e.slug}`} className="card flex gap-4 transition hover:border-brand">
            {e.image_url && /* eslint-disable-next-line @next/next/no-img-element */ <img src={e.image_url} alt="" className="h-24 w-24 rounded-lg object-cover" />}
            <div>
              <h2 className="text-xl font-semibold">{e.title}</h2>
              <p className="text-sm text-muted">{dateTime(e.starts_at)}</p>
              {e.location && <p className="text-sm text-muted">{e.location}</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { site } from "@/content/site";

export type EventCard = {
  id: string; slug: string; title: string; category: string; date: string; time: string;
  location: string; summary: string; capacity: string; soldOut: boolean; image: string | null;
};

export default function EventsGrid({ events }: { events: EventCard[] }) {
  const [active, setActive] = useState("all");
  const shown = !site.showCategoryFilters || active === "all" ? events : events.filter((e) => e.category === active);

  return (
    <div>
      {site.showCategoryFilters && (
      <div role="tablist" aria-label="Filter events by category" className="-mx-1 mb-8 flex flex-wrap gap-2">
        {site.categories.map((c) => (
          <button key={c.id} role="tab" aria-selected={active === c.id} onClick={() => setActive(c.id)}
            className={`btn btn-sm ${active === c.id ? "" : "btn-ghost"}`}>{c.label}</button>
        ))}
      </div>
      )}

      {shown.length === 0 ? (
        <p className="card text-center text-muted">
          {events.length === 0 ? "New events are being scheduled. Check back soon." : "No events in this category right now."}
        </p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((e) => (
            <li key={e.id} className="card flex flex-col p-0 overflow-hidden">
              {e.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={e.image} alt="" className="h-40 w-full object-cover" />}
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="eyebrow">{site.categories.find((c) => c.id === e.category)?.label ?? "Event"}</span>
                  <span className={`badge ${e.soldOut ? "text-red-600" : ""}`}>{e.capacity}</span>
                </div>
                <h3 className="display text-xl font-semibold">{e.title}</h3>
                <p className="mt-2 text-sm font-medium">{e.date} · {e.time}</p>
                {e.location && <p className="text-sm text-muted">{e.location}</p>}
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{e.summary}</p>
                <Link href={`/events/${e.slug}`} className={`btn mt-5 ${e.soldOut ? "btn-ghost" : ""}`}>
                  {e.soldOut ? "Join waitlist" : "Reserve Spot"}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

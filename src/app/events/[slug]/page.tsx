import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicEvent } from "@/lib/events";
import { dateTime, nowMs } from "@/lib/format";
import TicketForm, { type TicketOption } from "@/components/TicketForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/events/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicEvent(slug);
  return { title: data?.event.title ?? "Event" };
}

export default async function EventPage({ params }: PageProps<"/events/[slug]">) {
  const { slug } = await params;
  const data = await getPublicEvent(slug);
  if (!data) notFound();
  const { event, ticketTypes, sponsors } = data;

  const now = nowMs();
  const closed = event.status === "closed" || new Date(event.ends_at ?? event.starts_at).getTime() < now - 6 * 3600 * 1000;
  const options: TicketOption[] = ticketTypes.map((t) => ({
    id: t.id, name: t.name, description: t.description, price_cents: t.price_cents, left: t.left, max_per_order: t.max_per_order,
    state: t.sale_start && new Date(t.sale_start).getTime() > now ? "notopen"
      : t.sale_end && new Date(t.sale_end).getTime() < now ? "ended"
      : t.left <= 0 ? "soldout" : "available",
  }));
  const mapUrl = event.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}` : null;

  return (
    <article className="space-y-8">
      {event.image_url && /* eslint-disable-next-line @next/next/no-img-element */ <img src={event.image_url} alt="" className="max-h-80 w-full rounded-xl object-cover" />}
      <header>
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <p className="mt-2 text-muted">{dateTime(event.starts_at)}</p>
        {(event.location || event.address) && (
          <p className="text-muted">
            {event.location}{event.location && event.address ? " · " : ""}
            {mapUrl ? <a className="underline" href={mapUrl} target="_blank" rel="noreferrer">{event.address}</a> : event.address}
          </p>
        )}
      </header>
      {event.description && <div className="whitespace-pre-line leading-relaxed">{event.description}</div>}

      <section>
        <h2 className="mb-3 text-xl font-semibold">Tickets</h2>
        {closed ? <p className="text-muted">Ticket sales for this event are closed.</p>
          : options.length === 0 ? <p className="text-muted">Tickets aren&apos;t available yet.</p>
          : <TicketForm slug={event.slug} eventId={event.id} options={options} />}
      </section>

      {sponsors.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Sponsored by</h2>
          <div className="flex flex-wrap items-center gap-6">
            {sponsors.map((s) => {
              const inner = s.logo_url
                ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={s.logo_url} alt={s.name} className="h-12 object-contain" />
                : <span className="font-semibold">{s.name}</span>;
              return s.link_url ? <a key={s.id} href={s.link_url} target="_blank" rel="noreferrer sponsored">{inner}</a> : <span key={s.id}>{inner}</span>;
            })}
          </div>
        </section>
      )}
    </article>
  );
}

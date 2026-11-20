import Link from "next/link";
import { site } from "@/content/site";
import { getUpcomingEvents } from "@/lib/events";
import { dateParts, hoursAgoIso } from "@/lib/format";
import EventsGrid, { type EventCard } from "@/components/EventsGrid";
import ContactForm from "@/components/ContactForm";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const events = await getUpcomingEvents(hoursAgoIso(6)).catch(() => []);

  const cards: EventCard[] = events.map((e) => {
    const d = dateParts(e.starts_at);
    const soldOut = e.left !== null && e.left <= 0;
    const summary = e.summary || (e.description ? e.description.replace(/\s+/g, " ").slice(0, 170).trim() + (e.description.length > 170 ? "…" : "") : "");
    return {
      id: e.id, slug: e.slug, title: e.title, category: e.category, date: d.date, time: d.time,
      location: [e.location, e.address].filter(Boolean).join(", "), summary, soldOut, image: e.image_url,
      capacity: e.cap == null ? "Open" : soldOut ? "Sold out" : e.left! <= Math.ceil(e.cap * 0.25) ? `${e.left} spots left` : `Capacity ${e.cap}`,
    };
  });

  const next = events[0];
  const nextDate = next ? dateParts(next.starts_at) : null;

  // Partner logos come from sponsors added to upcoming events; placeholders until then.
  const seen = new Set<string>();
  const partners = events.flatMap((e) => e.sponsors).filter((s) => (seen.has(s.name) ? false : seen.add(s.name))).slice(0, 6);

  const inquiry = typeof sp.inquiry === "string" ? sp.inquiry : "general";

  return (
    <>
      {/* HERO */}
      <section className="border-b border-line">
        <div className="wrap section grid items-center gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="eyebrow">{site.hero.eyebrow}</p>
            <h1 className="display mt-4 text-4xl font-semibold sm:text-5xl lg:text-6xl">{site.hero.headline}</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{site.hero.subheadline}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/#events" className="btn">Explore Upcoming Events</Link>
              <Link href="/?inquiry=partnership#contact" className="btn btn-ghost">Partner With Us</Link>
            </div>
          </div>
          {next && nextDate && (
            <aside className="card hidden lg:block" aria-label="Next event">
              <p className="eyebrow">Next up</p>
              <h2 className="display mt-3 text-2xl font-semibold">{next.title}</h2>
              <p className="mt-2 text-sm font-medium">{nextDate.date} · {nextDate.time}</p>
              {next.location && <p className="text-sm text-muted">{next.location}</p>}
              <Link href={`/events/${next.slug}`} className="btn mt-5 w-full">Reserve Spot</Link>
            </aside>
          )}
        </div>

        {/* PROOF STRIP */}
        <div className="border-t border-line bg-tint">
          <div className="wrap grid gap-8 py-8 md:grid-cols-[auto_1fr] md:items-center md:gap-14">
            <dl className="grid grid-cols-3 gap-6 text-center md:text-left">
              {site.stats.map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="display text-3xl font-semibold sm:text-4xl">{s.value}</dd>
                  <p className="text-xs text-muted sm:text-sm" aria-hidden="true">{s.label}</p>
                </div>
              ))}
            </dl>
            <div>
              <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-muted md:text-left">Our partners &amp; sponsors</p>
              <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 md:justify-start">
                {partners.length
                  ? partners.map((p) => (
                      <li key={p.name}>
                        {p.logo_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.logo_url} alt={p.name} className="h-8 object-contain opacity-80" />
                          : <span className="font-semibold text-muted">{p.name}</span>}
                      </li>
                    ))
                  : [1, 2, 3, 4].map((n) => (
                      <li key={n} className="flex h-9 w-24 items-center justify-center rounded-md border border-dashed border-line text-xs text-muted">Logo {n}</li>
                    ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* WHO WE ARE */}
      <section id="who-we-are" className="section">
        <div className="wrap">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="eyebrow">Who we are</p>
              <h2 className="display mt-3 text-3xl font-semibold sm:text-4xl">{site.mission.title}</h2>
            </div>
            <div className="space-y-5 text-lg leading-relaxed text-muted">
              <p>{site.mission.body}</p>
              <p className="text-base">
                <span className="font-semibold text-foreground">Built for: </span>
                {site.mission.builtFor.map((b) => <span key={b} className="badge mr-2">{b}</span>)}
              </p>
              <p className="text-base">{site.mission.goal}</p>
            </div>
          </div>
          <ul className="mt-12 grid gap-5 md:grid-cols-3">
            {site.pillars.map((p, i) => (
              <li key={p.title} className="card">
                <span className="display text-3xl text-brand">0{i + 1}</span>
                <h3 className="mt-3 text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* EVENTS */}
      <section id="events" className="section border-y border-line bg-tint">
        <div className="wrap">
          <p className="eyebrow">Current &amp; upcoming events</p>
          <h2 className="display mb-8 mt-3 text-3xl font-semibold sm:text-4xl">Find your next room.</h2>
          <EventsGrid events={cards} />
        </div>
      </section>

      {/* TESTIMONIALS */}
      {site.testimonials.length > 0 && (
        <section id="testimonials" className="section">
          <div className="wrap">
            <p className="eyebrow">Testimonials</p>
            <h2 className="display mb-8 mt-3 text-3xl font-semibold sm:text-4xl">What attendees say.</h2>
            <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {site.testimonials.map((t) => (
                <li key={t.name} className="card flex flex-col">
                  <blockquote className="flex-1 leading-relaxed">“{t.quote}”</blockquote>
                  <footer className="mt-5 border-t border-line pt-4 text-sm">
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-muted">{t.role}</p>
                    <p className="mt-1 text-xs text-muted">Attended: {t.event}</p>
                  </footer>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* CONTACT */}
      <section id="contact" className="section border-t border-line bg-tint">
        <div className="wrap grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="eyebrow">Get in touch</p>
            <h2 className="display mt-3 text-3xl font-semibold sm:text-4xl">Let&apos;s talk.</h2>
            <p className="mt-4 text-muted">Questions about an event, interested in partnering, or want us to host something in your city? Send us a note.</p>
            <dl className="mt-8 space-y-4 text-sm">
              <div><dt className="font-semibold">Email</dt><dd><a className="text-brand underline" href={`mailto:${site.contact.email}`}>{site.contact.email}</a></dd></div>
              <div><dt className="font-semibold">Phone</dt><dd><a className="hover:underline" href={`tel:${site.contact.phone.replace(/[^+\d]/g, "")}`}>{site.contact.phone}</a></dd></div>
              <div><dt className="font-semibold">Based in</dt><dd className="text-muted">{site.contact.location}</dd></div>
            </dl>
          </div>
          <ContactForm defaultType={inquiry} />
        </div>
      </section>
    </>
  );
}

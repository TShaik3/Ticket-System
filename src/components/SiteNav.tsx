import Link from "next/link";
import { site } from "@/content/site";
import { db } from "@/lib/supabase/admin";
import { hoursAgoIso } from "@/lib/format";

const links = [
  { href: "/#who-we-are", label: "Who We Are" },
  { href: "/#events", label: "Upcoming Events" },
  { href: "/#testimonials", label: "Testimonials" },
  { href: "/#contact", label: "Contact" },
];

async function nextEventHref() {
  try {
    const { data } = await db().from("events").select("slug").eq("status", "published")
      .gte("starts_at", hoursAgoIso(6)).order("starts_at").limit(1).maybeSingle();
    return data ? `/events/${data.slug}` : "/#events";
  } catch {
    return "/#events";
  }
}

export default async function SiteNav() {
  const cta = await nextEventHref();
  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-background/85 backdrop-blur">
      <div className="wrap flex h-16 items-center justify-between gap-4">
        {/* BRANDING: swap the text for your logo, e.g. <img src="/logo.svg" alt={site.name} className="h-8" /> */}
        <Link href="/" className="display text-xl font-semibold">{site.name}</Link>

        <nav aria-label="Main" className="hidden items-center gap-7 text-sm md:flex">
          {links.map((l) => <Link key={l.href} href={l.href} className="text-muted hover:text-foreground">{l.label}</Link>)}
        </nav>

        <div className="flex items-center gap-2">
          <Link href={cta} className="btn btn-sm">Join Next Event</Link>
          {/* Mobile menu without JavaScript */}
          <details className="relative md:hidden">
            <summary className="btn btn-ghost btn-sm list-none" aria-label="Menu">Menu</summary>
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-line bg-surface p-2 shadow-lg">
              {links.map((l) => <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-tint">{l.label}</Link>)}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

import Link from "next/link";
import { site } from "@/content/site";

const nav = [
  { href: "/#who-we-are", label: "Who We Are" },
  { href: "/#events", label: "Upcoming Events" },
  { href: "/#testimonials", label: "Testimonials" },
  { href: "/#contact", label: "Contact" },
];

export default function Footer() {
  const socials = [
    { label: "Instagram", href: site.social.instagram },
    { label: "LinkedIn", href: site.social.linkedin },
    { label: "X", href: site.social.x },
  ].filter((s) => s.href);
  return (
    <footer className="no-print border-t border-line bg-tint">
      <div className="wrap flex flex-col gap-8 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <p className="display text-xl font-semibold">{site.name}</p>
          <p className="mt-2 text-sm text-muted">Curated in-person events for people building things worth talking about.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {nav.map((l) => <Link key={l.href} href={l.href} className="text-muted hover:text-foreground">{l.label}</Link>)}
          {socials.map((s) => <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="text-muted hover:text-foreground">{s.label}</a>)}
        </nav>
      </div>
      <div className="wrap flex justify-between border-t border-line py-5 text-xs text-muted">
        <span>© {new Date().getFullYear()} {site.name}. All rights reserved.</span>
        <Link href="/admin" className="hover:text-foreground">Admin</Link>
      </div>
    </footer>
  );
}

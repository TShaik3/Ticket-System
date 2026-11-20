/**
 * Editable site content. EVERYTHING in this file is SAMPLE CONTENT: replace it with your real
 * details before launch (especially the stats and testimonials, which must be real and accurate).
 * Events, sponsors and inquiries come from the database, not from this file.
 */
import { SITE_NAME } from "@/lib/format";

export const site = {
  name: SITE_NAME,
  hero: {
    eyebrow: "Curated in-person networking",
    headline: "Build real professional relationships. Skip the small talk.",
    subheadline:
      "Small, thoughtfully curated gatherings where founders, creatives and industry professionals are introduced to the people worth knowing.",
  },
  // SAMPLE: replace with your real numbers
  stats: [
    { value: "2,500+", label: "Connections made" },
    { value: "20+", label: "Events every year" },
    { value: "4.9★", label: "Attendee rating" },
  ],
  mission: {
    title: "Networking that feels like meeting friends, not working a room.",
    body: "We host curated events throughout the year for people who want depth over business cards. Every guest list is built with intent, every introduction has a reason, and every event is the start of a relationship, not the end of one.",
    builtFor: ["Founders", "Creatives", "Industry professionals"],
    goal: "Our goal is simple: help you leave every event with at least three people you'll actually follow up with.",
  },
  pillars: [
    { title: "Curated guest lists", body: "Every attendee is reviewed so the room is full of people worth meeting." },
    { title: "Intentional introductions", body: "Hosts connect you with the right people so you never have to cold-approach a stranger." },
    { title: "Year-round community", body: "Events are the start. Stay connected with the community between gatherings." },
  ],
  // SAMPLE: replace with real, permissioned attendee quotes. Delete the array contents to hide the section.
  testimonials: [
    { quote: "I met my co-founder's first customer within twenty minutes. No awkward pitching, just great conversations.", name: "Jordan Rivera", role: "Founder, Northwind Labs", event: "Founders Mixer" },
    { quote: "The most relaxed and genuinely useful event I've been to. Every introduction had a reason behind it.", name: "Priya Shah", role: "Creative Director, Studio Ember", event: "Creatives Evening" },
    { quote: "Small room, right people. I left with three follow-up meetings booked.", name: "Marcus Lee", role: "VP Engineering, Cobalt", event: "Tech & Industry Night" },
  ],
  // SAMPLE contact details
  contact: {
    email: "hello@example.org",
    phone: "(555) 010-0199",
    location: "Your City, State",
  },
  // Leave a URL empty ("") to hide that link
  social: { instagram: "", linkedin: "", x: "" },
  // Category filter tabs on the events grid. Set to true to turn them back on
  // (then give each event a Category in admin).
  showCategoryFilters: false,
  categories: [
    { id: "all", label: "All Events" },
    { id: "founders", label: "Founders" },
    { id: "creatives", label: "Creatives" },
    { id: "tech", label: "Tech & Industry" },
  ],
  inquiryTypes: [
    { id: "general", label: "General question" },
    { id: "partnership", label: "Partnership / sponsorship" },
    { id: "host", label: "Host or suggest an event" },
    { id: "press", label: "Press" },
  ],
};

export const categoryLabel = (id: string) => site.categories.find((c) => c.id === id)?.label ?? "";

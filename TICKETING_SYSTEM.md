# Event Ticketing System: Overview & Requirements

A ticketing website for personal events (parties, dinners, community gatherings, workshops, etc.). This document describes what the system does, who uses it, and what to build. Items marked **(MVP)** are the minimum needed to launch; the rest are nice-to-haves.

---

## 1. Goals

- Let guests find an event, get a ticket, and receive it quickly.
- Let the host control capacity, pricing, and who gets in.
- Make check-in at the door fast and hard to fake.
- Keep it simple and cheap to run for small, occasional events.

---

## 2. Users & Roles

| Role | What they do |
|------|--------------|
| **Guest / Attendee** | Browses events, gets tickets, views/downloads their ticket |
| **Host / Admin** (you) | Creates events, sets ticket types, tracks sales, manages guest list |
| **Door Staff** (optional) | Scans tickets at entry; no access to sales or settings |

---

## 3. Core Features

### 3.1 Public Site (Guest-Facing)
- **Event page (MVP):** title, date/time, location (map link), description, photos, host info, FAQ.
- **Ticket selection (MVP):** choose ticket type and quantity, see price and remaining availability.
- **Checkout (MVP):** name, email, optional phone, optional custom questions (dietary needs, plus-one names, etc.).
- **Confirmation (MVP):** on-screen confirmation plus email with the ticket.
- **Ticket delivery (MVP):** unique QR code per ticket, viewable in the browser, emailed as a link or PDF, and addable to Apple/Google Wallet (later).
- **Order lookup:** guests retrieve their ticket by email or a magic link (no account required).
- **Event listing page:** upcoming events, past events archive.
- **Waitlist:** join if sold out; auto-notify if tickets free up.
- **Mobile-friendly design (MVP):** most guests will use phones.

### 3.2 Ticket Types
- Free / RSVP-only **(MVP)**
- Paid, general admission **(MVP)**
- Tiered (Early Bird, Regular, VIP) with different prices and perks
- Invite-only / promo code / password-protected tickets
- Per-ticket-type quantity limits and sale start/end dates
- Max tickets per order (e.g., 4)

### 3.3 Payments
- Online payment via **Stripe** (cards, Apple Pay, Google Pay) or PayPal **(MVP if events are paid)**
- Optional: Venmo / Zelle / cash with manual "mark as paid" by the host
- Promo/discount codes
- Refunds (full/partial) from the admin panel
- Decide who pays processing fees (host absorbs vs. added to price)
- Receipts via email

### 3.4 Host Admin Dashboard
- **Create/edit events (MVP):** all details, images, capacity, ticket types, publish/unpublish.
- **Sales overview (MVP):** tickets sold, revenue, remaining capacity.
- **Guest list (MVP):** searchable, sortable, exportable to CSV.
- **Manual actions:** add a guest (comp ticket), resend ticket, cancel/refund an order, transfer a ticket to another name.
- **Email guests:** send updates or reminders to all ticket holders of an event.
- **Duplicate event:** reuse a past event as a template.
- **Custom registration questions** per event.
- **Basic analytics:** sales over time, traffic sources, check-in rate.

### 3.5 Check-In (Day of Event)
- **QR scanner (MVP):** web page that uses the phone camera to scan and validate tickets.
- Shows valid / already used / invalid, with guest name and ticket type.
- Each ticket can only be scanned once; duplicates are flagged.
- Manual lookup by name/email as a fallback.
- Live attendance count (checked-in vs. total).
- Works with poor venue Wi-Fi (offline mode is a later enhancement).

### 3.6 Notifications (Email / SMS)
- Order confirmation + ticket **(MVP)**
- Event reminder (e.g., 24 hours before)
- Event update/change/cancellation notice
- Waitlist spot available
- Post-event thank-you or feedback survey

---

## 4. Typical User Flows

**Guest buys a ticket**
1. Opens event link → reads details
2. Picks ticket type and quantity → enters name/email → pays
3. Sees confirmation → receives email with QR ticket
4. At the door: shows QR → gets scanned → enters

**Host runs an event**
1. Logs in → creates event → sets tickets/prices/capacity → publishes
2. Shares the link (text, social, email)
3. Monitors sales/guest list → emails updates
4. Event day: opens scanner → checks guests in
5. After: exports guest list, reviews numbers

---

## 5. Data Model (Simplified)

- **Event:** id, title, description, start/end, venue, address, image, capacity, status (draft/published/closed)
- **TicketType:** id, event_id, name, price, quantity_total, quantity_sold, sale_start, sale_end, max_per_order
- **Order:** id, event_id, buyer_name, buyer_email, total, payment_status, payment_id, created_at
- **Ticket:** id, order_id, ticket_type_id, attendee_name, qr_code/token, status (valid/used/cancelled/refunded), checked_in_at
- **PromoCode:** id, event_id, code, discount, usage_limit, expires_at
- **Question / Answer:** custom registration form fields and responses
- **Admin User:** id, email, password hash, role

---

## 6. Non-Functional Requirements

- **Security (MVP):** HTTPS, hashed passwords, admin login protected, unguessable ticket tokens (signed/random, not sequential IDs), payment details handled by Stripe only (never stored).
- **Prevent overselling:** inventory is reserved/decremented atomically at checkout; held tickets expire after ~10 minutes if unpaid.
- **Privacy:** only collect needed info; guest data visible to admins only; allow deletion on request.
- **Performance:** handle bursts when a link is shared (small scale: tens to hundreds of concurrent users).
- **Reliability:** emails retry on failure; payment webhooks handled idempotently.
- **Accessibility:** readable contrast, keyboard navigable, screen-reader-friendly.
- **Backups:** regular database backups.

---

## 7. Suggested Tech Options

Pick based on comfort level; none is required.

| Layer | Simple / Fast | More Custom |
|-------|---------------|-------------|
| Frontend | Next.js (React) or plain HTML + Tailwind | SvelteKit, Vue/Nuxt |
| Backend | Next.js API routes / Node (Express) | Python (Django/FastAPI), Rails |
| Database | SQLite (tiny scale) or Postgres (Supabase/Neon) | Postgres |
| Auth (admin) | NextAuth / Supabase Auth / simple password | Custom |
| Payments | Stripe Checkout + webhooks | Stripe Elements |
| Email | Resend, SendGrid, Postmark | SMTP |
| QR codes | `qrcode` library; scanning via `html5-qrcode` | Native scanner |
| Hosting | Vercel / Netlify / Render / Fly.io | VPS |

**No-code alternative to consider:** for just a few personal events, tools like Eventbrite, Luma, Tito, or Ticket Tailor already do most of this. Building custom makes sense if you want your own branding, no platform fees, or the learning experience.

---

## 8. Suggested Build Phases

1. **Phase 1 (MVP):** single event page, free/paid tickets, Stripe checkout, email with QR ticket, admin login, guest list, QR check-in page.
2. **Phase 2:** multiple events, ticket tiers, promo codes, reminders, CSV export, refunds.
3. **Phase 3:** waitlist, custom questions, wallet passes, analytics, offline check-in, SMS.

---

## 9. Decisions Made

| Topic | Decision |
|-------|----------|
| Pricing | Both free and paid events; paid via **Stripe** (test mode now, switch to a business account before real payments) |
| Volume | ~2 ticketed events/month, 20-50 guests each; a few weekly announcement-only events (no ticketing) |
| Access | Public; promoted on personal announcement boards |
| Check-in | QR code scanning, with a printable/phone guest list as backup |
| Platform | **Standalone custom site** (WordPress dropped) |
| Branding | Keep generic for now; apply real branding at the end (see section 12) |
| Extras | Promo codes, waitlist, sponsor options |
| Refunds | Only with an approved reason (manual, admin-approved) |
| Timeline | No fixed deadline; the current basic signup system covers near-term events |
| Ticket transfers | To be decided later |
| Stack | **Next.js + Supabase + Stripe Checkout + Resend**, deployed on **Cloudflare Workers** |
| Admins | Just the owner for now; role table (`owner`/`admin`/`staff`) allows more people later |
| Build status | MVP built; see [README.md](README.md) for setup |

---

## 10. Hosting & Framework Options

### Can I use...?

| Option | Works? | Why |
|--------|--------|-----|
| **Google Sites** | No | Static page builder only. No server code, so it can't process Stripe webhooks, store orders, or validate QR codes. It can only link out or embed a form. |
| **Vercel** | Yes | Best fit for Next.js. Serverless API routes handle Stripe webhooks and email. Note: the free Hobby plan is for **non-commercial use** only, so charging for tickets likely needs the paid Pro plan (about $20/month). Check current terms. |
| **Cloudflare (Pages/Workers)** | Yes | Generous free tier that allows commercial use; includes D1 (SQL database). Slightly more setup than Vercel; some Node libraries need adjusting. |
| **Netlify** | Yes | Similar to Vercel (static + serverless functions). Check its commercial-use terms. |
| **Render / Railway / Fly.io** | Yes | Run a normal Node/Python server plus a database. Simple mental model, small monthly cost. |
| **Firebase / Supabase** | Yes (backend) | Managed database and login. Pair with any of the hosts above. |
| **Cheap VPS (DigitalOcean, Hetzner)** | Yes | Full control, but you handle updates and security. |

### Framework choices

| Framework | Language | Good for |
|-----------|----------|----------|
| **Next.js** (recommended) | JavaScript/TypeScript | Frontend and backend in one project; best hosting and Stripe examples |
| SvelteKit | JavaScript/TypeScript | Lighter and simpler; also full-stack |
| Nuxt | JavaScript/TypeScript | Same idea, if you prefer Vue |
| Django | Python | Built-in admin panel gives you an event/guest dashboard almost free |
| Laravel | PHP | Good if you prefer staying in PHP; Stripe integration is smooth |
| Rails | Ruby | Fast to build CRUD apps with admin tools |

### Recommended stack (simple, low cost)

- **App:** Next.js (TypeScript) with Tailwind CSS
- **Database + admin login:** Supabase (Postgres, free tier is enough for this scale)
- **Payments:** Stripe Checkout with a webhook to confirm orders (works in test mode now)
- **Email:** Resend (order confirmations and tickets)
- **QR:** `qrcode` to generate, `html5-qrcode` for the phone scanner page
- **Hosting:** Vercel (Pro once charging for tickets) **or** Cloudflare if you want a free commercial tier
- **Domain:** a subdomain of your existing site (e.g., `tickets.yourdomain.org`) so it still feels like part of the same site

Alternative if you want less code: **Django**, since its built-in admin covers events, orders, and guest lists out of the box.

---

## 11. Sponsors

Start with the first; add more later:
1. **Sponsor logos** on the event page, confirmation emails, and tickets.
2. **Sponsor tier product** (Bronze/Silver/Gold) paid through Stripe.
3. **"Become a sponsor" inquiry form** that emails you.
4. **Sponsor-specific promo codes**.

---

## 12. Branding Checklist (Apply at the End)

Keep the design generic and centralized so branding is a quick swap:

| Item | Where it goes in the build |
|------|----------------------------|
| Logo | One file in `/public` plus the site header and email template |
| Colors | Design tokens in the Tailwind config / CSS variables |
| Fonts | Global font setting in the app layout |
| Ticket design | Ticket page and PDF template (logo, colors, footer text) |
| Email look | Email template header/footer |
| Sponsor logos | Event sponsor section (images uploaded in admin) |
| Terms / refund policy | A dedicated page linked at checkout |
| Domain and favicon | Hosting settings and `/public/favicon` |

---

## 13. Stripe: Test vs. Live

- Build and test with a Stripe **test-mode** account and test cards; no real money moves.
- Keep API keys in environment variables, never in code.
- Before going live: create the business account, swap the live keys and webhook secret into the host's environment settings, and run one small real purchase plus a refund.

---

## 14. Remaining Questions

1. **Framework/host:** are you comfortable with the recommended stack (Next.js + Supabase + Stripe + Vercel or Cloudflare), or do you prefer PHP (Laravel) or Python (Django)?
2. **Experience level:** how much coding do you want to do yourself vs. have it built for you?
3. **Domain:** will this live on a subdomain of your existing site or its own domain?
4. **Admin users:** just you, or several people managing events?
5. **Ticket transfers:** decide later (noted).

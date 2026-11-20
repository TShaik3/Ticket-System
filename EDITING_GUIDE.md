# Editing Guide: Where to Change Things

A quick map of where every piece of text, number, color, and setting lives.

**Two kinds of content:**
- **Admin area** (`/admin` on your site): events, tickets, promo codes, sponsors. Changes are live immediately, no code or deploy needed.
- **Code files** (in this project): landing page wording, colors, logo, fonts. After editing these, commit and push; Cloudflare rebuilds the site automatically.

---

## 1. Landing page text: `src/content/site.ts`

This one file holds almost all the wording on the home page. **All values currently there are sample placeholders.**

| What | Field in the file | Where it shows |
|------|-------------------|----------------|
| Small label above the headline | `hero.eyebrow` | Hero |
| Main headline | `hero.headline` | Hero |
| Supporting subheadline | `hero.subheadline` | Hero |
| Stat numbers and labels (2,500+, 20+, 4.9★) | `stats` (list of `value` + `label`) | Strip under the hero |
| Mission heading | `mission.title` | Who We Are |
| Mission paragraph | `mission.body` | Who We Are |
| "Built for" tags | `mission.builtFor` | Who We Are |
| Goal sentence | `mission.goal` | Who We Are |
| The 3 value pillars | `pillars` (title + body each) | Who We Are |
| Testimonials (quote, name, role, event) | `testimonials` | Testimonials section. **Delete all entries to hide the section.** |
| Contact email, phone, location | `contact.email`, `contact.phone`, `contact.location` | Contact section |
| Social links | `social.instagram`, `social.linkedin`, `social.x` | Footer. **A link only appears if you fill it in.** |
| Contact form dropdown options | `inquiryTypes` | Contact form |
| Event category tabs | `categories`, and `showCategoryFilters` | Events grid. **Tabs are currently off** (`false`). Set to `true` to show them. |

Only use real stats and real, permissioned testimonials before you launch.

## 2. Other landing page wording: `src/app/page.tsx`

A few headings and button labels are written directly in this file:

| Text | What to search for |
|------|--------------------|
| Hero buttons | `Explore Upcoming Events`, `Partner With Us` |
| "Next up" card on the hero | `Next up` (the event itself is picked automatically) |
| Partner strip label | `Our partners & sponsors` |
| Section headings | `Find your next room.`, `What attendees say.`, `Let's talk.` |
| Section labels | `Who we are`, `Current & upcoming events`, `Testimonials`, `Get in touch` |
| Contact intro paragraph | `Questions about an event` |
| When the capacity badge says "X spots left" | `Math.ceil(e.cap * 0.25)`: shows "spots left" once 25% or less remain; change `0.25` to adjust |

## 3. Navigation, footer, and logo

| What | File |
|------|------|
| **Logo** (replace the text name with an image) | `src/components/SiteNav.tsx`; look for the `BRANDING` comment. Put your image file in the `public/` folder, e.g. `public/logo.svg`. |
| Nav link names and the "Join Next Event" button | `src/components/SiteNav.tsx` |
| Footer tagline, footer links, copyright | `src/components/Footer.tsx` |
| Favicon (browser tab icon) | Replace `src/app/favicon.ico` |
| Browser tab title and search description | `src/app/layout.tsx` (`metadata`) |

## 4. Colors, fonts, and design: `src/app/globals.css`

Colors are defined once at the top (`:root`). Change a value and the whole site updates, including the checkout, ticket pages, and admin.

| Token | Controls | Current (light) |
|-------|----------|-----------------|
| `--brand` | Buttons, links, accents | `#3f3cbb` |
| `--brand-contrast` | Text on brand-colored buttons | `#ffffff` |
| `--background` | Page background | `#fbfaf7` |
| `--foreground` | Main text | `#16130f` |
| `--muted` | Secondary text | `#6a655d` |
| `--border` | Lines and card borders | `#e4e0d8` |
| `--surface` | Cards and inputs | `#ffffff` |
| `--tint` | Alternating section backgrounds | `#f3f1ea` |

The block under `@media (prefers-color-scheme: dark)` has the same tokens for dark mode, so update both if you change the palette.

| Other design settings | Where |
|-----------------------|-------|
| Fonts (headline serif is Fraunces, body is Geist) | `src/app/layout.tsx`, and `--font-display` / `--font-sans` in `globals.css` |
| Button shape and size | `.btn` rules in `globals.css` |
| Page width | `.wrap` (landing page) in `globals.css`; `src/components/Container.tsx` (inner pages) |
| Section spacing | `.section` in `globals.css` |

## 5. Site settings: `wrangler.jsonc` (and the Cloudflare dashboard)

| Setting | Name | Notes |
|---------|------|-------|
| Site name | `NEXT_PUBLIC_SITE_NAME` | Currently "Muslim Connect". Used in the nav, footer, tab title, and emails. |
| Website address | `NEXT_PUBLIC_SITE_URL` | Must be your real URL; used in Stripe redirects and email links. |
| Time zone | `NEXT_PUBLIC_TIMEZONE` | Event times are entered and shown in this zone (default `America/Los_Angeles`). |

Secrets and keys (Supabase, Stripe, Resend, `CONTACT_EMAIL`) are **not** in the code. Set them in the Cloudflare dashboard under your worker's Settings → Variables and Secrets. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` go in Settings → Builds → Build variables. For local work, they go in `.env.local`.

## 6. Events, tickets, and money: Admin area (`/admin`)

No code changes needed for any of these.

| What | Where in admin |
|------|----------------|
| Event title, date and time, venue, address, description, image, capacity, publish status | Events → open an event → **Details** |
| Short description on the home-page card (about 2 sentences) | Event → **Card summary** |
| Ticket names, prices (use 0 for free), quantities, max per order, sale start and end | Event → **Ticket types** |
| Promo codes (percent or dollar discount, usage limit, expiry) | Event → **Promo codes** |
| Sponsor names, logos, and links (logos also appear in the home page partner strip) | Event → **Sponsors** |
| Waitlist | Event → **Waitlist** (email everyone not yet notified) |
| Guest list, check-in, refunds with a reason, resend tickets | Event → **Guest list & orders** |
| Contact-form messages | **Inquiries** |

## 7. Emails: `src/lib/email.ts`

| What | Where |
|------|-------|
| Ticket confirmation wording and subject | `sendTicketEmail` |
| Waitlist notice wording | `sendWaitlistEmail` |
| Email header and accent color (`#4f46e5`) | `shell()`; change this to match your brand color |
| "From" name and address | `EMAIL_FROM` setting (see section 5) |

Emails are only sent once an email provider is connected. Until then, buyers get their tickets on the page right after checkout.

## 8. Ticket purchase pages and rules

| What | Where |
|------|-------|
| Wording on the QR ticket page | `src/app/orders/[token]/page.tsx` |
| Checkout form labels and messages | `src/components/TicketForm.tsx` |
| Error messages shown to buyers ("Sorry, there aren't enough tickets left...") | `src/app/events/[slug]/actions.ts` (`ERRORS`) |
| How long unpaid tickets are held (default about 31 minutes) | `src/app/events/[slug]/actions.ts` (`31 * 60 * 1000`). Stripe requires at least 30. |
| Scanner result messages ("Valid: let them in") | `src/components/Scanner.tsx` (`MESSAGES`) |

## 9. How to publish a change

**Code or text change (sections 1-5, 7, 8):**
1. Edit the file and save.
2. Try it locally with `npm run dev` (open http://localhost:3000).
3. Commit and push to GitHub. Cloudflare rebuilds and deploys automatically.

**Admin change (section 6):** just save it in `/admin`; it's live right away.

**Database change** (rare, e.g. a new migration file in `supabase/migrations/`): run the SQL in the Supabase SQL editor *before* deploying code that needs it.

## 10. Common tasks cheat sheet

| I want to... | Do this |
|--------------|---------|
| Change the headline | `src/content/site.ts` → `hero.headline` |
| Replace sample stats | `src/content/site.ts` → `stats` |
| Add real testimonials | `src/content/site.ts` → `testimonials` |
| Hide testimonials | Empty the `testimonials` list |
| Update contact details | `src/content/site.ts` → `contact` |
| Add social links | `src/content/site.ts` → `social` |
| Change the main color | `src/app/globals.css` → `--brand` (and the dark-mode one) |
| Add my logo | `src/components/SiteNav.tsx` (`BRANDING` comment) + file in `public/` |
| Turn the category tabs back on | `src/content/site.ts` → `showCategoryFilters: true` |
| Create a new event | `/admin` → New event |
| Offer a discount | Event → Promo codes |
| Add a sponsor logo | Event → Sponsors |
| Change the site name | `NEXT_PUBLIC_SITE_NAME` in `wrangler.jsonc` |
| See who contacted me | `/admin/inquiries` |

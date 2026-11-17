# Ticket System

Event ticketing site: Next.js + Supabase + Stripe Checkout + Resend, deployed on Cloudflare Workers.
Requirements and decisions are in [TICKETING_SYSTEM.md](TICKETING_SYSTEM.md).

## What's built

- **Public:** event list, event page (details, ticket types, promo codes, sponsors, waitlist when sold out), Stripe checkout, free tickets (no payment step), QR ticket page at `/orders/<token>`.
- **Admin (`/admin`):** create/edit events, ticket types, promo codes, sponsors, waitlist (email everyone), guest list (print / CSV), check-in buttons, refunds (a written reason is required), resend tickets.
- **Door scanning (`/admin/scan`):** phone camera QR scanner with valid / already used / invalid results, manual code entry, and a printable guest list as backup.
- **Safety:** seats are reserved atomically in the database (no overselling), unpaid holds expire after about 31 minutes, each QR can only be checked in once, Stripe webhooks are signature-verified and idempotent.
- **Roles:** the `admins` table has `owner`, `admin`, and `staff` (scan only). You are the only admin for now; add rows later for more people (see below).

## Setup

### 1. Supabase
1. Create a project at supabase.com.
2. SQL Editor: run [supabase/migrations/001_init.sql](supabase/migrations/001_init.sql).
3. Authentication → Users → **Add user** (your email + password, tick auto-confirm). Turn off public sign-ups: Authentication → Sign In / Providers → disable "Allow new users to sign up".
4. Make yourself the owner (SQL Editor):
   ```sql
   insert into admins (user_id, email, role)
   select id, email, 'owner' from auth.users where email = 'you@example.com';
   ```
5. Settings → API: copy the project URL, anon key, and service_role key.

**Adding another admin or door staff later:** create their user in Authentication → Users, then insert a row into `admins` with role `admin` or `staff`.

### 2. Stripe (test mode)
1. In a Stripe test-mode account, copy the secret key (`sk_test_...`).
2. Developers → Webhooks → add endpoint `https://YOUR-SITE/api/stripe/webhook` with events: `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`. Copy the signing secret (`whsec_...`).
3. For local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook` prints a local `whsec_`. Test card: `4242 4242 4242 4242`.

### 3. Resend (email)
Create an API key at resend.com. Verify your sending domain, then set `EMAIL_FROM`. Without a verified domain Resend only lets you send to your own address.

### 4. Run locally
```bash
cp .env.example .env.local   # fill in the values
npm install
npm run dev
```
Sign in at http://localhost:3000/login, create an event (set it to **Published**), add a ticket type, then buy a ticket.

### 5. Deploy to Cloudflare
```bash
npx wrangler login
# non-secret settings: edit "vars" in wrangler.jsonc (site name, site URL, timezone)
# NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be present at BUILD time too:
#   put them in .env.local (or a .env.production file) before deploying.
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put EMAIL_FROM
npm run deploy
```
Then add your custom domain in the Cloudflare dashboard (Workers → ticket-system → Settings → Domains), e.g. `tickets.yourdomain.org`, and update `NEXT_PUBLIC_SITE_URL` and the Stripe webhook URL to match. `npm run preview` runs the Cloudflare build locally.

### Going live with Stripe
Create the business account, then replace `STRIPE_SECRET_KEY` with the live key, create a new live-mode webhook endpoint, and replace `STRIPE_WEBHOOK_SECRET`. Make one small real purchase and refund it before announcing.

## Branding (do this last)

| What | Where |
|------|-------|
| Colors | `:root` variables in [src/app/globals.css](src/app/globals.css) (`--brand` etc.) |
| Logo | [src/components/Header.tsx](src/components/Header.tsx), with the image in `public/` |
| Site name | `NEXT_PUBLIC_SITE_NAME` |
| Font | [src/app/layout.tsx](src/app/layout.tsx) |
| Email look | `shell()` in [src/lib/email.ts](src/lib/email.ts) (the indigo `#4f46e5` is the brand color) |
| Favicon | replace `src/app/favicon.ico` |
| Timezone | `NEXT_PUBLIC_TIMEZONE` (event times are entered and shown in this zone) |

## Known limits / next steps

- **Experimental on Cloudflare:** Next 16's `proxy.ts` (keeps the admin login session fresh) runs as "Node.js middleware", which OpenNext marks experimental. It worked in local Cloudflare preview. If it misbehaves in production, delete `src/proxy.ts`; the only effect is that you'll need to sign in again about once an hour.
- No bot protection on checkout or waitlist yet. Consider Cloudflare Turnstile before heavy promotion.
- Sponsors and event images are URLs, not uploads (Supabase Storage can be added).
- Not built yet: comp/manual tickets, ticket transfers, reminder emails, wallet passes, admin UI for managing other admins.
- Refunds go through the app (reason recorded). Stripe's own dashboard refunds won't update order status here.

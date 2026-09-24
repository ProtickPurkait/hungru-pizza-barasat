# Hungru Pizza Barasat

A mobile-first, animated pizza website with a built-in no-code CMS and ordering flow.

- **Customer site**: bold, Gen-Z brand look; a hero with a signature "cheese-pull" pizza; a fast menu with veg filter
  and search; customisable items; cart; checkout; order confirmation with live status.
- **Admin (`/admin`)**: the restaurant manages everything without code: menu, prices, stock, photos, homepage,
  offers, reviews, story, contact and hours, ordering method, colours, logo, SEO and team access.
- **Ordering**: website checkout (orders saved and managed in admin), WhatsApp, an external platform
  (Zomato, Swiggy or any link), or phone. Switch any time in Admin → Ordering.

> **Content policy:** nothing about the real business is invented. Until the owner adds real details, placeholders
> are clearly marked **Sample**, missing contact info is hidden, and the admin **Launch checklist** lists what's left.

---

## Quick start (local development)

**Requirements:** Node.js 20.9+ and PostgreSQL 14+ (local install, or `docker compose up -d`).

```bash
cp .env.example .env.local          # then edit DATABASE_URL if needed
npm install
npm run db:setup                    # create tables + categories + clearly-marked sample content
# optional: npm run db:seed -- --demo   → also load a SAMPLE demo menu to try the ordering flow
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-strong-password' npm run admin:create
npm run dev                         # http://localhost:3000   ·   admin: http://localhost:3000/admin
```

`docker compose up -d` starts a local Postgres matching the default `DATABASE_URL`.

## How the owner uses it

| Task                                                                                 | Where                                  |
| ------------------------------------------------------------------------------------ | -------------------------------------- |
| Change a price, add a pizza, upload a photo, add sizes/crusts/add-ons                | **Menu items**                         |
| Mark something sold out (**goes live instantly**)                                    | **Menu items** (switch on each row)    |
| Rename / reorder / hide categories                                                   | **Categories**                         |
| Choose homepage best sellers                                                         | **Best sellers**                       |
| Hero headline, buttons, section order, marquee, final banner                         | **Homepage**                           |
| Deals (with optional start/end dates)                                                | **Offers**                             |
| Customer reviews, Why Hungru points, brand story                                     | **Reviews · Why Hungru · Brand story** |
| Address, phone, WhatsApp, map, opening hours, social links                           | **Contact & hours**                    |
| Checkout / WhatsApp / Zomato link / phone; delivery fee; minimum order; pause orders | **Ordering**                           |
| Incoming orders (auto-refresh + optional sound alert)                                | **Orders**                             |
| Logo, favicon, brand colours, footer                                                 | **Appearance**                         |
| Google title/description, share image                                                | **SEO & sharing**                      |
| Change password, add editors, analytics IDs                                          | **Settings**                           |

### Save → Preview → Publish

1. Edits are **saved as a draft**. The live site doesn't change yet.
2. **Preview** (top bar) shows the real website with your unpublished changes. Only signed-in admins can see it.
3. **Publish** makes everything live. **Publish history** can restore any earlier version.

Two things skip publishing because they're operational: **sold out / in stock** and **Pause online orders**.

## Ordering modes

| Mode                           | What customers do                                                              | Setup                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| **Website checkout** (default) | Fill a short form and get an order number and live status page                 | Keep **Admin → Orders** open. Payment is collected on delivery/pickup |
| **WhatsApp**                   | Order is saved, then a ready-made WhatsApp message opens with the order number | WhatsApp number in Ordering or Contact                                |
| **Other platform**             | Handoff page with their list and a "Continue to Zomato/Swiggy" button          | Platform name + link                                                  |
| **Phone**                      | Handoff page with their list and a call button                                 | Phone number                                                          |

All prices are re-calculated **on the server** from the published menu; the browser's totals are never trusted.
Orders are rate-limited per IP and protected by a honeypot field.

**Online payments** are intentionally not included (no gateway credentials). To add Razorpay, Stripe or similar, create a
payment step between `submitOrder` (`src/app/(site)/checkout/actions.ts`) and the confirmation page, and mark orders
paid via the gateway's webhook.

## Configuration

| Variable                                        | Required         | Description                                                                   |
| ----------------------------------------------- | ---------------- | ----------------------------------------------------------------------------- |
| `DATABASE_URL`                                  | ✅               | PostgreSQL connection string (Neon/Supabase/RDS: include `sslmode=require`)   |
| `NEXT_PUBLIC_SITE_URL`                          | ✅ in production | Public URL, used for canonical links, sitemap and social cards                |
| `MEDIA_STORAGE`                                 |                  | `db` (default, works everywhere) or `fs` (files on disk)                      |
| `MEDIA_DIR`                                     |                  | Folder for `MEDIA_STORAGE=fs` (default `./storage/media`); must be persistent |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` |                  | Only read by `npm run admin:create`                                           |
| `COOKIE_SECURE`                                 |                  | Set `false` only if production is served over plain HTTP (not recommended)    |
| `DATABASE_POOL_MAX`                             |                  | Max DB connections per server instance (default 10)                           |

No secrets are stored in code. Passwords are hashed with Argon2id; sessions are random tokens stored hashed in the
database, in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie. Login is rate-limited (5 failures per 15 minutes per account).

### Analytics (optional)

Add a **GA4 measurement ID** or **Plausible domain** in Admin → Settings → Analytics, then publish. Funnel events:
`homepage_view → menu_view → product_view → add_to_cart → cart_view → order_initiated → order_completed`.
Nothing loads or tracks until an ID is set. Events are sent from `src/lib/analytics.ts`.

## Deployment

### Design preview on Netlify (no database)

To review the look and flow before setting up a database, deploy with `DEMO_MODE=true` (already set in
`netlify.toml`):

1. In Netlify, choose **Add new site → Import an existing project → GitHub** and pick this repository and branch.
2. Keep the detected settings (build `npm run build`, publish `.next`) and click **Deploy**. No environment variables
   are needed.

In the preview:

- The site uses the built-in **SAMPLE** menu and placeholder text (all labelled), with a "Design preview" bar on top.
- Checkout prices orders on the server as usual, then shows the confirmation page **without saving or sending
  anything**.
- `/admin` explains that it needs a database.
- Search engines are told not to index the site.

**Going live later:** remove `DEMO_MODE` from `netlify.toml`, set `DATABASE_URL` and `NEXT_PUBLIC_SITE_URL` in
Netlify → Site configuration → Environment variables, run the one-time setup commands below against that database,
and redeploy.

### Vercel + Neon (recommended)

1. Create a Postgres database (e.g. Neon) and copy its connection string.
2. Import the repo in Vercel and set `DATABASE_URL` and `NEXT_PUBLIC_SITE_URL`.
3. Run once from your machine against the production DB:
   `DATABASE_URL=… npm run db:setup` and `DATABASE_URL=… ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run admin:create`.
4. Deploy. Uploads are stored in Postgres (`MEDIA_STORAGE=db`) and resized in the browser before upload to fit
   Vercel's request limits. Keep hero videos small (≈4 MB).

### Your own server (VPS)

```bash
npm ci && npm run build
npm run db:migrate                  # on every deploy
MEDIA_STORAGE=fs MEDIA_DIR=/var/lib/hungru/media npm start   # behind nginx/Caddy with HTTPS
```

Use a process manager (systemd/pm2). With a single instance, publishing updates the site instantly. With several
instances, each refreshes within 5 minutes (or configure a shared Next.js cache handler).

**Builds:** public pages are pre-rendered from the database and refreshed when you publish. If `DATABASE_URL` isn't
available at build time, the build still succeeds and pages render on demand instead.

## Adding the real menu

Either type it into **Admin → Menu items**, or fill `src/db/seed-data/menu.ts` (typed format, prices in ₹) and run
`npm run db:seed` on an empty database. Never commit invented items or prices.

## Scripts

| Command                                 | What it does                                                           |
| --------------------------------------- | ---------------------------------------------------------------------- |
| `npm run dev` / `build` / `start`       | Next.js development / production                                       |
| `npm run db:migrate`                    | Apply migrations (`src/db/migrations`)                                 |
| `npm run db:seed`                       | Seed an empty DB (`-- --demo` adds the SAMPLE demo menu)               |
| `npm run db:setup`                      | Migrate + seed                                                         |
| `npm run db:generate`                   | Create a migration after editing `src/db/schema.ts`                    |
| `npm run db:publish`                    | Publish current content from the command line                          |
| `npm run admin:create`                  | Create an admin (`-- --role editor`, `-- --reset` to reset a password) |
| `npm run lint` · `typecheck` · `format` | Code quality                                                           |
| `npm test`                              | Unit tests (Vitest)                                                    |
| `npm run test:e2e`                      | End-to-end tests (Playwright; resets `hungru_test` database)           |
| `npm run test:e2e:demo`                 | End-to-end tests of the no-database design preview (`DEMO_MODE=true`)  |

## Testing

- **Unit** (`tests/unit`): pricing and options, discounts, money formatting, validation, opening hours (incl. past
  midnight), WhatsApp message, link resolution, content hashing, structured data.
- **End-to-end** (`tests/e2e`, production build): full mobile order funnel, admin protection, draft → preview →
  publish, instant stock and pause toggles, WhatsApp and external ordering, media upload, responsive overflow at 9
  widths, touch targets, axe accessibility (WCAG 2.1 AA) and reduced motion.

E2E needs a Postgres database whose name contains `test` (default
`postgres://hungru:hungru_dev@localhost:5432/hungru_test`, override with `E2E_DATABASE_URL`). It's wiped on every run.

## Architecture

```
Admin (Server Actions, requireAdmin) ──► Postgres working tables ──Publish──► published_snapshots (one JSON document)
                                                  │                                        │
                                   Preview (draft mode + admin session)          Public site (cached; tag-invalidated)
                                                  └──── live overlay: product availability, "orders paused" ────┘
```

```
src/
  app/(site)/          public pages: home, menu, cart, checkout, order/[token]
  app/admin/           login + CMS pages; _actions/ = Server Actions
  app/api/             media upload, order status polling, preview on/off
  app/media/[id]/      serves uploaded media (immutable, cached for a year, range requests for video)
  components/site/     public UI: hero, cheese-pull pizza, sections, product sheet, cart…
  components/admin/    admin UI kit: forms, media picker, sortable lists, dialogs
  components/ui/       shared: FoodArt illustrations, veg mark, feature icons
  db/                  Drizzle schema, migrations, seed data
  lib/content/         zod schemas (single source of truth), compile/publish, loader
  lib/cart/            cart store and pricing (shared by browser and server)
  lib/ordering/        order placement, WhatsApp message, statuses
  lib/auth/            passwords, sessions, rate limiting
```

**Tech:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Drizzle ORM + PostgreSQL, Motion, zod,
zustand, dnd-kit, sharp, Argon2.

**Design system:** tokens live in `src/app/globals.css` (colours, type scale, shadows, easing). Display type is
Bricolage Grotesque, body type is DM Sans. Brand colours come from the CMS at runtime. Motion respects
`prefers-reduced-motion`. Food visuals are SVG illustrations until real photos are uploaded; they're never presented
as photographs.

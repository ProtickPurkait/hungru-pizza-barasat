<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project notes (Hungru Pizza Barasat)

- **Never hardcode business content** (prices, copy, contact details, hours, reviews) in components. Everything the
  public site shows comes from `getSiteData()` (`src/lib/content/get-site-content.ts`), which reads the published
  snapshot. Add new editable content to the zod schemas in `src/lib/content/schemas.ts` + `compile.ts`, then an admin editor.
- **Never invent real-world facts** (prices, reviews, ratings, addresses, hours, awards). Placeholders must be flagged
  `isSample` / clearly worded, and surfaced in the admin launch checklist.
- Publishing model: admin saves → working tables; Publish → `published_snapshots`. Product availability and
  "orders paused" are instant (`TAG_LIVE`). Invalidate with `updateTag` inside Server Actions.
- Every Server Action and admin route handler must call `requireAdmin()` itself — `src/proxy.ts` is only a first filter.
- Checkout re-prices everything on the server (`src/lib/ordering/place-order.ts`); never trust client totals.
- Public client components must not import values from `schemas.ts` (it pulls ~90 KB of zod into the browser). Put
  plain shared constants in `src/lib/content/constants.ts`; `import type` from `schemas.ts` is fine.
- Fonts: fallback faces in `globals.css` are metric-matched to the real fonts (incl. the condensed display width), so
  the swap doesn't shift layout. If you change a font, weight or `wdth`, re-measure the `size-adjust` values.
- Checks: `npm run lint && npm run typecheck && npm test && npm run test:e2e` (e2e needs Postgres; see README).

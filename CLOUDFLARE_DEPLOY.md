# Cloudflare deployment

This repository is designed to be hosted by Cloudflare Pages while GitHub remains the source repository.

## Runtime layout

- Static website: Cloudflare Pages, connected to the GitHub repository.
- Dynamic API: Cloudflare Pages Functions under `/api/*`.
- Database: Cloudflare D1 binding named `DB`.
- Cache: Cloudflare KV binding named `STATS_CACHE`.
- Object storage: Cloudflare R2 binding named `MEDIA`.
- Authentication: Better Auth + GitHub OAuth can be added to the same Pages Functions layer when admin-only features are needed.

## Pages setup

1. Open Cloudflare Dashboard.
2. Go to `Workers & Pages`.
3. Choose `Create application`.
4. Choose `Pages`.
5. Connect the GitHub repository.
6. Build settings:
   - Build command: leave empty.
   - Build output directory: `/`.
7. Add bindings to the Pages project:
   - D1 database binding: `DB`
   - KV namespace binding: `STATS_CACHE`
   - R2 bucket binding: `MEDIA`
8. Deploy.

The frontend calls `/api/stats`, `/api/visit`, and `/api/like` on the same origin. It no longer depends on `workers.dev`.

## D1 schema

Run `workers/stats-worker/schema.sql` against the D1 database once.

## Data ownership

- D1 is the source of truth for visits and likes.
- KV is only a short-lived cache for `/api/stats`.
- R2 is for large media or downloadable objects.
- Static post counts are calculated in the browser from `assets/js/site-data.js`.

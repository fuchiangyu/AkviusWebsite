# Akvius Personal Website

A static personal website for GitHub Pages.

## Dynamic stats

Visits and likes are designed for GitHub Pages + Cloudflare Worker.

Static pages read and write stats through:

```text
GET  /stats
POST /visit
POST /like
```

The Worker implementation is in `workers/stats-worker`.

Deploy flow:

```powershell
cd workers/stats-worker
wrangler d1 create akvius-stats
```

Copy the returned database id into `wrangler.toml`, then run:

```powershell
wrangler d1 execute akvius-stats --file=./schema.sql
wrangler deploy
```

After deploy, set the Worker URL in `assets/js/site-stats.js`:

```js
const apiBase = "https://akvius-stats.<your-subdomain>.workers.dev";
```

Until `apiBase` is filled, the site uses local browser fallback data only.

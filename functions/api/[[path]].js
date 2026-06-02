const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

const json = (body, status = 200, extraHeaders = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });

const todayKey = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
};

const readBody = async (request) => {
  try {
    return await request.json();
  } catch {
    return {};
  }
};

const cacheKey = "stats:v1";

const getCachedStats = async (env) => {
  if (!env.STATS_CACHE) return null;

  try {
    const cached = await env.STATS_CACHE.get(cacheKey, "json");
    return cached || null;
  } catch {
    return null;
  }
};

const setCachedStats = async (env, stats) => {
  if (!env.STATS_CACHE) return;

  try {
    await env.STATS_CACHE.put(cacheKey, JSON.stringify(stats), { expirationTtl: 10 });
  } catch {
    // KV is an optimization. D1 remains the source of truth.
  }
};

const clearCachedStats = async (env) => {
  if (!env.STATS_CACHE) return;

  try {
    await env.STATS_CACHE.delete(cacheKey);
  } catch {
    // Ignore cache cleanup failures.
  }
};

const getStatsFromDb = async (db) => {
  const totalVisits =
    (await db.prepare("SELECT value FROM counters WHERE key = 'total_visits'").first("value")) || 0;
  const dailyRows = await db.prepare("SELECT day, count FROM daily_visits ORDER BY day").all();
  const likeRows = await db.prepare("SELECT key, title, href, kind, total FROM like_totals ORDER BY total DESC").all();
  const eventRows = await db
    .prepare("SELECT key, title, href, kind, count, created_at AS time FROM like_events ORDER BY id DESC LIMIT 200")
    .all();

  return {
    visits: {
      total: Number(totalVisits || 0),
      daily: Object.fromEntries((dailyRows.results || []).map((row) => [row.day, Number(row.count || 0)])),
    },
    likes: Object.fromEntries(
      (likeRows.results || []).map((row) => [
        row.key,
        {
          title: row.title,
          href: row.href,
          kind: row.kind,
          total: Number(row.total || 0),
        },
      ]),
    ),
    likeEvents: (eventRows.results || []).map((row) => ({
      key: row.key,
      title: row.title,
      href: row.href,
      kind: row.kind,
      count: Number(row.count || 1),
      time: row.time,
    })),
    updatedAt: new Date().toISOString(),
  };
};

const getStats = async (env) => {
  const cached = await getCachedStats(env);
  if (cached) return cached;

  const stats = await getStatsFromDb(env.DB);
  await setCachedStats(env, stats);
  return stats;
};

const recordVisit = async (env) => {
  const day = todayKey();

  await env.DB.prepare(
    "INSERT INTO counters (key, value, updated_at) VALUES ('total_visits', 1, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = value + 1, updated_at = CURRENT_TIMESTAMP",
  ).run();
  await env.DB.prepare(
    "INSERT INTO daily_visits (day, count, updated_at) VALUES (?, 1, CURRENT_TIMESTAMP) ON CONFLICT(day) DO UPDATE SET count = count + 1, updated_at = CURRENT_TIMESTAMP",
  )
    .bind(day)
    .run();

  await clearCachedStats(env);
  return getStats(env);
};

const recordLike = async (env, payload) => {
  const key = String(payload.key || "").trim();
  if (!key) return json({ error: "Missing like key" }, 400);

  const title = String(payload.title || key).slice(0, 180);
  const href = String(payload.href || "").slice(0, 500);
  const kind = String(payload.kind || "page").slice(0, 40);

  await env.DB.prepare(
    "INSERT INTO like_totals (key, title, href, kind, total, updated_at) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET title = excluded.title, href = excluded.href, kind = excluded.kind, total = total + 1, updated_at = CURRENT_TIMESTAMP",
  )
    .bind(key, title, href, kind)
    .run();
  await env.DB.prepare("INSERT INTO like_events (key, title, href, kind, count, created_at) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)")
    .bind(key, title, href, kind)
    .run();

  await clearCachedStats(env);
  return json(await getStats(env));
};

const getR2Object = async (env, key) => {
  if (!env.MEDIA) return json({ error: "R2 binding MEDIA is not configured" }, 500);

  const object = await env.MEDIA.get(key);
  if (!object) return json({ error: "Object not found" }, 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=86400");
  return new Response(object.body, { headers });
};

export const onRequest = async ({ request, env }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!env.DB) {
    return json({ error: "D1 binding DB is not configured" }, 500);
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, "") || "/";

  if (request.method === "GET" && path === "/stats") {
    return json(await getStats(env));
  }

  if (request.method === "POST" && path === "/visit") {
    return json(await recordVisit(env));
  }

  if (request.method === "POST" && path === "/like") {
    return recordLike(env, await readBody(request));
  }

  if (request.method === "GET" && path.startsWith("/media/")) {
    return getR2Object(env, decodeURIComponent(path.slice("/media/".length)));
  }

  return json({ error: "Not found" }, 404);
};

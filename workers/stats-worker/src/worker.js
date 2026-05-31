const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
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

const getStats = async (db) => {
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

const recordVisit = async (db) => {
  const day = todayKey();

  await db
    .prepare(
      "INSERT INTO counters (key, value, updated_at) VALUES ('total_visits', 1, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = value + 1, updated_at = CURRENT_TIMESTAMP",
    )
    .run();
  await db
    .prepare(
      "INSERT INTO daily_visits (day, count, updated_at) VALUES (?, 1, CURRENT_TIMESTAMP) ON CONFLICT(day) DO UPDATE SET count = count + 1, updated_at = CURRENT_TIMESTAMP",
    )
    .bind(day)
    .run();

  return getStats(db);
};

const recordLike = async (db, payload) => {
  const key = String(payload.key || "").trim();
  if (!key) return json({ error: "Missing like key" }, 400);

  const title = String(payload.title || key).slice(0, 180);
  const href = String(payload.href || "").slice(0, 500);
  const kind = String(payload.kind || "page").slice(0, 40);

  await db
    .prepare(
      "INSERT INTO like_totals (key, title, href, kind, total, updated_at) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET title = excluded.title, href = excluded.href, kind = excluded.kind, total = total + 1, updated_at = CURRENT_TIMESTAMP",
    )
    .bind(key, title, href, kind)
    .run();
  await db
    .prepare("INSERT INTO like_events (key, title, href, kind, count, created_at) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)")
    .bind(key, title, href, kind)
    .run();

  return json(await getStats(db));
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (!env.DB) {
      return json({ error: "D1 binding DB is not configured" }, 500);
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/stats") {
      return json(await getStats(env.DB));
    }

    if (request.method === "POST" && url.pathname === "/visit") {
      return json(await recordVisit(env.DB));
    }

    if (request.method === "POST" && url.pathname === "/like") {
      return recordLike(env.DB, await readBody(request));
    }

    return json({ error: "Not found" }, 404);
  },
};

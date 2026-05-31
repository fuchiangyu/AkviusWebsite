window.AkviusData = (() => {
  const visitStorageKey = "akvius-total-visits";
  const visitHistoryKey = "akvius-visit-history";
  const likeEventHistoryKey = "akvius-like-events";
  let remoteStats = null;

  const siteContent = {
    categories: {
      languages: {
        posts: [
          {
            key: "post-chagatai-dictionary",
            title: "Chagatai Dictionary",
            href: "categories/languages/chaghatay/posts/chagatai-dictionary.html",
            category: "Languages",
            publishedAt: "2026-05-28",
            baseLikes: 0,
          },
        ],
      },
      music: {
        posts: [],
      },
      notes: {
        posts: [],
      },
      tools: {
        apps: [
          {
            key: "tool-chagatai-dictionary",
            title: "Chagatai Dictionary Tool",
            href: "categories/tools/apps/chagatai-dictionary/index.html",
            baseLikes: 0,
          },
        ],
      },
    },
  };

  const categoryCounts = Object.fromEntries(
    Object.entries(siteContent.categories).map(([key, category]) => [
      key,
      (category.posts || []).length + (category.apps || []).length,
    ]),
  );

  const pageLikeTargets = Object.fromEntries([
    ...Object.values(siteContent.categories).flatMap((category) =>
      (category.posts || []).map((post) => [
        post.key,
        {
          title: post.title,
          href: post.href,
          category: post.category,
          publishedAt: post.publishedAt,
          baseCount: post.baseLikes,
          kind: "post",
        },
      ]),
    ),
    ...Object.values(siteContent.categories).flatMap((category) =>
      (category.apps || []).map((app) => [
        app.key,
        {
          title: app.title,
          href: app.href,
          baseCount: app.baseLikes,
          kind: "tool",
        },
      ]),
    ),
  ]);

  const postTargets = Object.values(pageLikeTargets).filter((target) => target.kind === "post");

  const readJson = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const writeJson = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Local analytics are optional.
    }
  };

  const formatCount = (count) => {
    const value = Number(count || 0);

    if (value >= 1000000) {
      const compact = value / 1000000;
      return `${Number(compact.toFixed(compact >= 10 ? 1 : 2))}m`;
    }

    if (value >= 1000) {
      const compact = value / 1000;
      return `${Number(compact.toFixed(compact >= 10 ? 1 : 2))}k`;
    }

    return value.toLocaleString("en-US");
  };

  const todayKey = () =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

  const recordVisit = () => {
    let visits = 0;
    let history = {};

    try {
      visits = Number(localStorage.getItem(visitStorageKey) || visits) + 1;
      localStorage.setItem(visitStorageKey, String(visits));
      history = readJson(visitHistoryKey, {});
      const day = todayKey();
      history[day] = Number(history[day] || 0) + 1;
      writeJson(visitHistoryKey, history);
    } catch {
      visits += 1;
    }

    return { visits, history };
  };

  const getLikeCount = (key, fallback = 0) => {
    const remoteCount = remoteStats?.likes?.[key]?.total;
    if (Number.isFinite(Number(remoteCount))) return Number(remoteCount);

    try {
      const stored = Number(localStorage.getItem(`akvius-like-count:${key}`));
      return Number.isFinite(stored) ? stored : fallback;
    } catch {
      return fallback;
    }
  };

  const getVisitState = (fallback = { visits: 0, history: {} }) => ({
    visits: Number(remoteStats?.visits?.total ?? fallback.visits ?? 0),
    history: remoteStats?.visits?.daily || fallback.history || {},
  });

  const getLikeEvents = () => remoteStats?.likeEvents || readJson(likeEventHistoryKey, []);

  const setRemoteStats = (stats) => {
    if (!stats || typeof stats !== "object") return;
    remoteStats = {
      visits: {
        total: Number(stats.visits?.total || 0),
        daily: stats.visits?.daily || {},
      },
      likes: stats.likes || {},
      likeEvents: stats.likeEvents || [],
      updatedAt: stats.updatedAt || new Date().toISOString(),
    };
  };

  const recordLike = (key, count) => {
    try {
      localStorage.setItem(`akvius-like-count:${key}`, String(count));
      const events = readJson(likeEventHistoryKey, []);
      events.unshift({
        key,
        title: pageLikeTargets[key]?.title || key,
        count,
        time: new Date().toISOString(),
      });
      writeJson(likeEventHistoryKey, events.slice(0, 80));
    } catch {
      // The visual feedback still works when storage is unavailable.
    }
  };

  const getTopLikedTarget = (kind = "post") =>
    Object.entries(pageLikeTargets)
      .filter(([, target]) => !kind || target.kind === kind)
      .map(([key, target]) => ({
        key,
        ...target,
        count: getLikeCount(key, target.baseCount),
      }))
      .sort((a, b) => b.count - a.count)[0];

  return {
    categoryCounts,
    formatCount,
    getLikeCount,
    getLikeEvents,
    getVisitState,
    getTopLikedTarget,
    likeEventHistoryKey,
    pageLikeTargets,
    postTargets,
    readJson,
    recordLike,
    recordVisit,
    setRemoteStats,
    siteContent,
    todayKey,
    visitHistoryKey,
  };
})();

window.AkviusData = (() => {
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

  const formatCount = (count) => {
    if (count === null || count === undefined || count === "/") return "/";

    const value = Number(count);
    if (!Number.isFinite(value)) return "/";

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

  const getLikeCount = (key) => {
    if (!remoteStats) return null;

    const remoteCount = remoteStats?.likes?.[key]?.total;
    if (Number.isFinite(Number(remoteCount))) return Number(remoteCount);

    return 0;
  };

  const getVisitState = () => ({
    visits: remoteStats ? Number(remoteStats?.visits?.total || 0) : null,
    history: remoteStats?.visits?.daily || null,
  });

  const getLikeEvents = () => remoteStats?.likeEvents || [];

  const hasRemoteStats = () => Boolean(remoteStats);

  const setRemoteStats = (stats) => {
    if (!stats || typeof stats !== "object") {
      remoteStats = null;
      return;
    }

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

  const getTopLikedTarget = (kind = "post") =>
    Object.entries(pageLikeTargets)
      .filter(([, target]) => !kind || target.kind === kind)
      .map(([key, target]) => ({
        key,
        ...target,
        count: getLikeCount(key),
      }))
      .sort((a, b) => Number(b.count || 0) - Number(a.count || 0))[0];

  return {
    categoryCounts,
    formatCount,
    getLikeCount,
    getLikeEvents,
    getVisitState,
    getTopLikedTarget,
    hasRemoteStats,
    pageLikeTargets,
    postTargets,
    setRemoteStats,
    siteContent,
    todayKey,
  };
})();

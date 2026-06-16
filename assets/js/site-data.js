window.AkviusData = (() => {
  let remoteStats = null;

  const siteContent = {
    categories: {
      languages: {
        posts: [
          {
            key: "post-chaghatay-dictionary",
            title: "Chaghatay Dictionary",
            href: "categories/languages/chaghatay/posts/chaghatay-dictionary.html",
            category: "Languages",
            publishedAt: "2026-06-06",
            baseLikes: 0,
            tags: ["Chaghatay", "Dictionary", "Tool"],
            translationKeys: {
              title: "postDictionaryTitle",
              summary: "postDictionaryOverviewText",
            },
          },
          {
            key: "post-uyghur-vocabulary-trainer",
            title: "Uyghur Vocabulary Trainer",
            href: "categories/languages/uyghur/posts/uyghur-vocabulary-trainer.html",
            category: "Languages",
            publishedAt: "2026-06-17",
            baseLikes: 0,
            tags: ["Uyghur", "Vocabulary", "Tool"],
            translationKeys: {
              title: "postUyghurVocabTitle",
              summary: "postUyghurVocabOverviewText",
            },
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
            key: "tool-chaghatay-dictionary",
            title: "Chaghatay Dictionary Tool",
            href: "categories/tools/apps/chaghatay-dictionary/index.html",
            description: "Working Chaghatay Dictionary app for looking up words.",
            searchText: "Chaghatay Dictionary tool app lookup words",
            baseLikes: 0,
          },
          {
            key: "tool-uyghur-vocabulary-trainer",
            title: "Uyghur Vocabulary Trainer",
            href: "categories/tools/apps/uyghur-vocabulary-trainer/index.html",
            description: "Flashcards and quizzes for Uyghur words.",
            searchText: "Uyghur Vocabulary Trainer flashcards quiz word bank progress",
            baseLikes: 0,
          },
        ],
      },
      tags: {
        posts: [],
      },
      logs: {
        posts: [],
      },
    },
  };

  const versions = [
    {
      key: "v0-3",
      title: "V0.3",
      href: "categories/logs/index.html#v0-3",
      publishedAt: "2026-06-06",
      notes: [
        "Adjusted several page styles",
        "Added tags, search, and post table of contents",
        "Added Chinese, Latin Uyghur, and Uyghur language versions",
      ],
    },
    {
      key: "v0-2",
      title: "V0.2",
      href: "categories/logs/index.html#v0-2",
      publishedAt: "2026-06-02",
      notes: ["Published the first online version with the fuchiangyu.top domain"],
    },
    {
      key: "v0-1",
      title: "V0.1",
      href: "categories/logs/index.html#v0-1",
      publishedAt: "2026-05-28",
      notes: ["Built the first website draft"],
    },
    {
      key: "v0-0",
      title: "V0.0",
      href: "categories/logs/index.html#v0-0",
      publishedAt: "2026-05-26",
      notes: ["The first idea took shape"],
    },
  ];

  const categoryMetadata = {
    languages: {
      title: "Languages",
      href: "categories/languages/index.html",
      description: "Language learning, scripts, names, grammar notes, and references.",
    },
    music: {
      title: "Music",
      href: "categories/music/index.html",
      description: "Songs, lyrics, theory, playlists, and music inspiration.",
    },
    notes: {
      title: "Notes",
      href: "categories/notes/index.html",
      description: "Thoughts, writings, reflections, and daily jottings.",
    },
    tools: {
      title: "Tools",
      href: "categories/tools/index.html",
      description: "Useful tools, links, snippets, and productivity helpers.",
    },
    tags: {
      title: "Tags",
      href: "categories/tags/index.html",
      description: "Post labels that connect related notes across shelves.",
    },
    logs: {
      title: "Logs",
      href: "categories/logs/index.html",
      description: "Version notes and site update records.",
    },
  };

  const postSummaries = {
    "post-chaghatay-dictionary":
      "A small website for looking up Chaghatay words. The data is based on A Dictionary of Early Middle Turkic.",
    "post-uyghur-vocabulary-trainer":
      "A focused trainer for studying Uyghur common vocabulary with cards, quizzes, search, and local progress.",
  };

  const allPosts = Object.values(siteContent.categories).flatMap((category) => category.posts || []);

  const tagIndex = allPosts.reduce((index, post) => {
    (post.tags || []).forEach((tag) => {
      const key = tag.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (!index[key]) {
        index[key] = {
          key,
          title: tag,
          href: `categories/tags/${key}/index.html`,
          posts: [],
        };
      }
      index[key].posts.push(post);
    });
    return index;
  }, {});

  const searchIndex = [
    ...Object.entries(categoryMetadata).map(([key, category]) => ({
      key: `category-${key}`,
      kind: "Category",
      title: category.title,
      href: category.href,
      description: category.description,
      searchText: `${category.title} ${category.description}`,
    })),
    ...Object.values(tagIndex).map((tag) => ({
      key: `tag-${tag.key}`,
      kind: "Tag",
      title: `#${tag.title}`,
      href: tag.href,
      description: `${tag.posts.length} ${tag.posts.length === 1 ? "post" : "posts"} tagged #${tag.title}.`,
      searchText: `#${tag.title} ${tag.title} ${(tag.posts || []).map((post) => `${post.title} ${post.category || ""}`).join(" ")}`,
    })),
    ...allPosts.map((post) => ({
      key: post.key,
      kind: "Post",
      title: post.title,
      href: post.href,
      description: postSummaries[post.key] || `${post.category || "Post"} article.`,
      searchText: `${post.title} ${post.category || ""} ${(post.tags || []).join(" ")} ${postSummaries[post.key] || ""}`,
    })),
    ...Object.values(siteContent.categories).flatMap((category) =>
      (category.apps || []).map((app) => ({
        key: app.key,
        kind: "Tool",
        title: app.title,
        href: app.href,
        description: app.description || "Working tool app.",
        searchText: `${app.title} ${app.searchText || app.description || "tool app"}`,
      })),
    ),
    ...versions.map((version) => ({
      key: `log-${version.key}`,
      kind: "Log",
      title: version.title,
      href: version.href,
      description: `${version.publishedAt} ${(version.notes || []).join(" ")}`,
      searchText: `${version.title} ${version.publishedAt} ${(version.notes || []).join(" ")}`,
    })),
  ];

  const getCategoryCount = (key, category) => {
    if (key === "tags") return Object.keys(tagIndex).length;
    if (key === "tools") return (category.apps || []).length;
    if (key === "logs") return versions.length;
    return (category.posts || []).length;
  };

  const getCategoryCountLabel = (key, count) => {
    if (key === "tags") return count === 1 ? "tag" : "tags";
    if (key === "tools") return count === 1 ? "item" : "items";
    if (key === "logs") return count === 1 ? "log" : "logs";
    return count === 1 ? "post" : "posts";
  };

  const categoryCounts = Object.fromEntries(
    Object.entries(siteContent.categories).map(([key, category]) => [key, getCategoryCount(key, category)]),
  );

  const categoryCountLabels = Object.fromEntries(
    Object.entries(categoryCounts).map(([key, count]) => [key, getCategoryCountLabel(key, count)]),
  );

  const pageLikeTargets = Object.fromEntries([
    ...Object.values(siteContent.categories).flatMap((category) =>
      (category.posts || []).map((post) => [
        post.key,
        {
          key: post.key,
          title: post.title,
          href: post.href,
          category: post.category,
          publishedAt: post.publishedAt,
          summary: postSummaries[post.key] || "",
          tags: post.tags || [],
          translationKeys: post.translationKeys || {},
          baseCount: post.baseLikes,
          kind: "post",
        },
      ]),
    ),
    ...Object.values(siteContent.categories).flatMap((category) =>
      (category.apps || []).map((app) => [
        app.key,
        {
          key: app.key,
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

  const getTopLikedTarget = (kind = "post") => {
    if (!remoteStats) return null;

    return Object.entries(pageLikeTargets)
      .filter(([, target]) => !kind || target.kind === kind)
      .map(([key, target]) => ({
        key,
        ...target,
        count: getLikeCount(key),
      }))
      .sort((a, b) => Number(b.count || 0) - Number(a.count || 0))[0];
  };

  const getTrendingTag = () => {
    const tags = Object.values(tagIndex).map((tag) => {
      const score = tag.posts.reduce((total, post) => {
        const likeScore = Number(getLikeCount(post.key));
        return total + (Number.isFinite(likeScore) ? likeScore : 0);
      }, 0);

      return {
        ...tag,
        score,
        count: tag.posts.length,
      };
    });

    return tags.sort((a, b) => b.score - a.score || b.count - a.count || a.title.localeCompare(b.title))[0] || null;
  };

  const getRecentPost = () =>
    [...postTargets].sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))[0] || null;

  const getCurrentVersion = () =>
    [...versions].sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))[0] || null;

  return {
    categoryCounts,
    categoryCountLabels,
    formatCount,
    getLikeCount,
    getLikeEvents,
    getCurrentVersion,
    getRecentPost,
    getVisitState,
    getTrendingTag,
    getTopLikedTarget,
    hasRemoteStats,
    pageLikeTargets,
    postTargets,
    setRemoteStats,
    searchIndex,
    siteContent,
    tagIndex,
    todayKey,
    versions,
  };
})();

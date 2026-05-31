const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const brand = document.querySelector(".brand");
const brandMark = document.querySelector(".brand-mark");
let brandMenu = document.querySelector(".brand-menu");
const currentPage = document.body.dataset.page;
const themeToggle = document.querySelector(".theme-toggle");
const randomLink = document.querySelector("[data-random-link]");
const themeStorageKey = "akvius-theme";
const themeParamKey = "theme";
const validThemes = ["light", "dark"];
const siteData = window.AkviusData;
const siteStats = window.AkviusStats;
const visitSessionKey = "akvius-visit-counted";

const getUrlTheme = () => {
  const theme = new URLSearchParams(window.location.search).get(themeParamKey);
  return validThemes.includes(theme) ? theme : null;
};

const getSavedTheme = () => {
  try {
    return localStorage.getItem(themeStorageKey);
  } catch {
    return null;
  }
};

const saveTheme = (theme) => {
  try {
    localStorage.setItem(themeStorageKey, theme);
  } catch {
    // Theme switching should still work when storage is unavailable.
  }
};

const applyTheme = (theme) => {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = theme;
  themeToggle?.setAttribute("aria-pressed", String(isDark));
  themeToggle?.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
};

const preferredTheme =
  getUrlTheme() || getSavedTheme() || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

applyTheme(preferredTheme);
saveTheme(preferredTheme);

const withCurrentTheme = (href) => {
  const currentTheme = document.documentElement.dataset.theme;
  if (!validThemes.includes(currentTheme)) return href;

  try {
    const url = new URL(href, window.location.href);
    const isSameSiteFile = url.protocol === "file:";
    const isSameOriginHttp = url.protocol !== "file:" && url.origin === window.location.origin;

    if (!isSameSiteFile && !isSameOriginHttp) return href;

    const [pathAndSearch, hash = ""] = href.split("#");
    const [path, search = ""] = pathAndSearch.split("?");
    const params = new URLSearchParams(search);
    params.set(themeParamKey, currentTheme);
    return `${path}?${params.toString()}${hash ? `#${hash}` : ""}`;
  } catch {
    return href;
  }
};

const getRootPrefix = () => {
  const stylesheet = document.querySelector('link[rel="stylesheet"]')?.getAttribute("href") || "";
  return stylesheet.replace(/assets\/css\/styles\.css$/, "");
};

const rootPrefix = getRootPrefix();

const localHref = (path) => withCurrentTheme(`${rootPrefix}${path}`);

const formatDisplayDate = (value) => {
  const date = new Date(`${value}T00:00:00+08:00`);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};

const getNavigationMarkup = () => `
    <a href="${localHref("index.html")}" data-page="home">Home</a>
    <div class="nav-item nav-item-has-panel">
      <button class="nav-panel-trigger" type="button" data-page="categories" data-href="${localHref("categories/index.html")}" aria-expanded="false">Categories</button>
      <div class="nav-panel" aria-label="Category navigation">
        <a class="nav-panel-overview" href="${localHref("categories/index.html")}">All Categories</a>
        <div class="nav-panel-group">
          <a class="nav-panel-title" href="${localHref("categories/languages/index.html")}">Languages</a>
          <a href="${localHref("categories/languages/uyghur/index.html")}">Uyghur</a>
          <a href="${localHref("categories/languages/turkish/index.html")}">Turkish</a>
          <a href="${localHref("categories/languages/chaghatay/index.html")}">Chaghatay</a>
        </div>
        <div class="nav-panel-group">
          <a class="nav-panel-title" href="${localHref("categories/music/index.html")}">Music</a>
          <a href="${localHref("categories/music/posts/index.html")}">Posts</a>
        </div>
        <div class="nav-panel-group">
          <a class="nav-panel-title" href="${localHref("categories/notes/index.html")}">Notes</a>
          <a href="${localHref("categories/notes/index.html")}">Posts</a>
        </div>
        <div class="nav-panel-group">
          <a class="nav-panel-title" href="${localHref("categories/tools/index.html")}">Tools</a>
          <a href="${localHref("categories/tools/apps/chagatai-dictionary/index.html")}">Chagatai Dictionary</a>
        </div>
      </div>
    </div>
    <a href="${localHref("timeline/index.html")}" data-page="timeline">Timeline</a>
    <a href="${localHref("about/index.html")}" data-page="about">About</a>
  `;

const renderNavigation = () => {
  if (!navLinks) return;

  navLinks.innerHTML = getNavigationMarkup();
  navLinks.classList.remove("open");

  if (!brandMenu) {
    navLinks.insertAdjacentHTML("afterend", '<div class="brand-menu" aria-label="Navigation menu"></div>');
    brandMenu = document.querySelector(".brand-menu");
  }

  if (brandMenu) {
    brandMenu.innerHTML = getNavigationMarkup();
  }
};

renderNavigation();

const shouldRecordVisit = (() => {
  try {
    if (sessionStorage.getItem(visitSessionKey)) return false;
    sessionStorage.setItem(visitSessionKey, "1");
    return true;
  } catch {
    return true;
  }
})();

const localVisitState = shouldRecordVisit ? siteData.recordVisit() : siteData.getVisitState();
let siteVisitState = siteData.getVisitState(localVisitState);

const updateNavPanelHeights = () => {
  document.querySelectorAll(".nav-item-has-panel").forEach((item) => {
    const panel = item.querySelector(".nav-panel");
    if (!panel) return;

    const menu = item.closest(".brand-menu, .nav-links");
    const shouldMeasure = menu?.classList.contains("open") && item.classList.contains("panel-open");
    panel.style.setProperty("--nav-panel-height", shouldMeasure ? `${panel.scrollHeight + 28}px` : "0px");
  });
};

const setExpandedNavItem = (item, expanded) => {
  const button = item.querySelector(".nav-panel-trigger");
  item.classList.toggle("panel-open", expanded);
  button?.setAttribute("aria-expanded", String(expanded));
};

const openNavItem = (item) => {
  const menu = item.closest(".brand-menu, .nav-links");
  if (!menu?.classList.contains("open")) return;

  menu.querySelectorAll(".nav-item-has-panel.panel-open").forEach((openItem) => {
    if (openItem !== item) {
      setExpandedNavItem(openItem, false);
    }
  });

  setExpandedNavItem(item, true);
  updateNavPanelHeights();
};

document.querySelectorAll(".nav-item-has-panel").forEach((item) => {
  const panel = item.querySelector(".nav-panel");
  if (!panel) return;

  const expandToContent = () => {
    openNavItem(item);
  };

  const collapseToState = () => {
    if (item.classList.contains("panel-open")) return;
    panel.style.setProperty("--nav-panel-height", "0px");
  };

  item.addEventListener("pointerenter", expandToContent);
  item.addEventListener("focusin", expandToContent);
  item.addEventListener("pointerleave", collapseToState);
  item.addEventListener("focusout", () => window.setTimeout(collapseToState, 0));
});

const toggleNavigation = () => {
  const menu = brandMenu || navLinks;
  const isOpen = menu.classList.toggle("open");
  navToggle?.setAttribute("aria-expanded", String(isOpen));
  brand?.setAttribute("aria-expanded", String(isOpen));
  brandMark?.setAttribute("aria-expanded", String(isOpen));
  updateNavPanelHeights();
};

navToggle?.addEventListener("click", toggleNavigation);

brand?.addEventListener("click", toggleNavigation);

document.querySelectorAll(".nav-panel-trigger").forEach((button) => {
  button.classList.toggle("active", button.dataset.page === currentPage);
  button.addEventListener("click", () => {
    const menu = button.closest(".brand-menu, .nav-links");
    const shouldToggle = window.matchMedia("(max-width: 880px)").matches || menu?.classList.contains("open");
    if (!shouldToggle) {
      window.location.href = button.dataset.href;
      return;
    }

    const item = button.closest(".nav-item");
    const isOpen = !item.classList.contains("panel-open");
    if (isOpen) {
      openNavItem(item);
      return;
    }

    setExpandedNavItem(item, false);
    updateNavPanelHeights();
  });
});

themeToggle?.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  saveTheme(nextTheme);
});

const sectionLinks = [...document.querySelectorAll(".nav-links a, .brand-menu a")];

sectionLinks.forEach((link) => {
  link.classList.toggle("active", link.dataset.page === currentPage);

  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    brandMenu?.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
    brand?.setAttribute("aria-expanded", "false");
    brandMark?.setAttribute("aria-expanded", "false");
  });
});

document.querySelectorAll('a[href$=".html"], a[href*=".html#"], a[href*=".html?"]').forEach((link) => {
  link.addEventListener("click", () => {
    link.href = withCurrentTheme(link.getAttribute("href"));
  });
});

const renderCategoryCounts = (counts) => {
  document.querySelectorAll("[data-category-count]").forEach((stat) => {
    const key = stat.dataset.categoryCount;
    const count = counts[key] ?? 0;
    stat.textContent = siteData.formatCount(count);
  });
};

if (document.querySelector("[data-category-count]")) {
  renderCategoryCounts(siteData.categoryCounts);
}

randomLink?.addEventListener("click", (event) => {
  const targets = siteData.postTargets;
  const target = targets[Math.floor(Math.random() * targets.length)]?.href;
  if (!target) return;

  event.preventDefault();
  window.location.href = withCurrentTheme(target);
});

const likeButtons = [...document.querySelectorAll("[data-like-key]")];

const renderLikeButton = (button, count) => {
  const value = button.querySelector("[data-like-value]");
  if (!value) return;

  value.textContent = siteData.formatCount(count);
  button.setAttribute("aria-label", `Like this page. ${count.toLocaleString("en-US")} likes`);
};

const renderLikeButtons = () => {
  likeButtons.forEach((button) => {
    const key = button.dataset.likeKey;
    const baseCount = Number(button.dataset.likeCount || 0);
    renderLikeButton(button, siteData.getLikeCount(key, baseCount));
  });
};

renderLikeButtons();

likeButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const key = button.dataset.likeKey;
    const baseCount = Number(button.dataset.likeCount || 0);
    const target = siteData.pageLikeTargets[key] || {};
    const localCount = siteData.getLikeCount(key, baseCount) + 1;
    siteData.recordLike(key, localCount);

    button.classList.remove("like-button-pulse");
    void button.offsetWidth;
    button.classList.add("like-button-pulse");
    window.setTimeout(() => button.classList.remove("like-button-pulse"), 360);
    renderLikeButton(button, localCount);
    renderTopLiked();
    renderCombinedChart();

    try {
      const stats = await siteStats?.recordLike({
        key,
        title: target.title || key,
        href: target.href || window.location.pathname,
        kind: target.kind || "page",
      });
      if (stats) {
        siteData.setRemoteStats(stats);
        siteVisitState = siteData.getVisitState(localVisitState);
        renderLikeButtons();
        updateVisitCount();
        renderTopLiked();
        renderCombinedChart();
      }
    } catch {
      // Local fallback has already updated the visible count.
    }
  });
});

const liveClock = document.querySelector(".live-clock");
const visitCount = document.querySelector("[data-visit-count]");
const siteDays = document.querySelector("[data-site-days]");

const updateLiveClock = () => {
  if (!liveClock) return;

  const now = new Date();
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const formatted = `${Number(value.year)}/${Number(value.month)}/${Number(value.day)} ${value.hour}:${value.minute}:${value.second}`;

  liveClock.textContent = formatted;
  liveClock.setAttribute("datetime", now.toISOString());
};

updateLiveClock();
setInterval(updateLiveClock, 1000);

const updateVisitCount = () => {
  if (!visitCount) return;
  siteVisitState = siteData.getVisitState(localVisitState);
  document.querySelectorAll("[data-visit-count]").forEach((node) => {
    node.textContent = siteData.formatCount(siteVisitState.visits);
  });
};

updateVisitCount();

const resolveThemeHref = (href) => {
  return withCurrentTheme(`${rootPrefix}${href}`);
};

const renderTopLiked = () => {
  const top = siteData.getTopLikedTarget("post");
  if (!top) return;

  document.querySelectorAll("[data-top-liked-card]").forEach((card) => {
    card.href = resolveThemeHref(top.href);
  });

  document.querySelectorAll("[data-top-liked-count]").forEach((node) => {
    node.textContent = siteData.formatCount(top.count);
  });

  document.querySelectorAll("[data-top-liked-title]").forEach((node) => {
    node.textContent = top.title;
  });
};

renderTopLiked();

const renderTimeline = () => {
  const track = document.querySelector("[data-timeline-track]");
  if (!track) return;

  const posts = [
    ...siteData.postTargets,
    {
      title: "创建网页V0",
      href: "",
      publishedAt: "2026-05-26",
      inert: true,
    },
  ].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  track.dataset.count = String(posts.length);

  if (!posts.length) {
    track.insertAdjacentHTML(
      "beforeend",
      '<p class="timeline-empty">No published posts yet.</p>',
    );
    return;
  }

  posts.forEach((post, index) => {
    const dateLabel = formatDisplayDate(post.publishedAt);

    const tagName = post.inert ? "div" : "a";
    const hrefAttribute = post.inert ? "" : ` href="${resolveThemeHref(post.href)}"`;

    track.insertAdjacentHTML(
      "beforeend",
      `
        <${tagName} class="timeline-node ${post.inert ? "timeline-node-static" : ""} ${index === 0 ? "is-active" : ""}"${hrefAttribute}>
          <span class="node-dot"></span>
          <span class="node-card">
            <span class="node-copy">
              <strong>${post.title}</strong>
              <time datetime="${post.publishedAt}">${dateLabel}</time>
            </span>
          </span>
        </${tagName}>
      `,
    );
  });
};

renderTimeline();

const renderCombinedChart = () => {
  const chart = document.querySelector("[data-combined-chart]");
  if (!chart) return;

  siteVisitState = siteData.getVisitState(localVisitState);
  const history = siteVisitState.history || {};
  const events = siteData.getLikeEvents();
  const escapeSvgText = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const startDate = new Date("2026-05-26T00:00:00+08:00");
  const today = new Date();
  const spanDays = Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / 86400000) + 1);
  const days = [...Array(spanDays)].map((_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    const key = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
    return { key, label: formatDisplayDate(key), count: Number(history[key] || 0) };
  });
  const max = Math.max(1, ...days.map((day) => day.count));
  const width = Math.max(1120, 150 + days.length * 120);
  const height = 500;
  const pad = { top: 48, right: 44, bottom: 90, left: 58 };
  const innerWidth = width - pad.left - pad.right;
  const innerHeight = height - pad.top - pad.bottom;
  const xForIndex = (index) => pad.left + (innerWidth / Math.max(1, days.length - 1)) * index;
  const yForCount = (count) => pad.top + innerHeight - (count / max) * innerHeight;
  const points = days.map((day, index) => `${xForIndex(index)},${yForCount(day.count)}`).join(" ");
  const areaPoints = `${pad.left},${pad.top + innerHeight} ${points} ${pad.left + innerWidth},${pad.top + innerHeight}`;
  const likesByDay = new Map(days.map((day) => [day.key, new Map()]));

  events.forEach((event) => {
    const date = new Date(event.time);
    if (Number.isNaN(date.getTime())) return;

    const key = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
    const dayLikes = likesByDay.get(key);
    if (!dayLikes) return;

    const postKey = event.key || event.title || "unknown";
    const existing = dayLikes.get(postKey) || {
      title: event.title || siteData.pageLikeTargets?.[postKey]?.title || "Unknown post",
      count: 0,
    };
    existing.count += 1;
    dayLikes.set(postKey, existing);
  });

  const likeTags = days
    .map((day, index) => {
      const entries = [...(likesByDay.get(day.key)?.values() || [])].sort((a, b) => b.count - a.count);
      if (!entries.length) return "";

      const x = xForIndex(index);
      const y = Math.max(pad.top + 28, yForCount(day.count) - 64);
      const tagWidth = Math.min(220, Math.max(138, ...entries.map((entry) => entry.title.length * 7.2 + 56)));
      const tagX = Math.min(Math.max(x - tagWidth / 2, pad.left), width - pad.right - tagWidth);

      return `
        <g class="chart-like-cluster">
          <line class="chart-like-stem" x1="${x}" y1="${yForCount(day.count)}" x2="${x}" y2="${y + 18}" />
          ${entries
            .slice(0, 3)
            .map((entry, entryIndex) => {
              const tagY = y + entryIndex * 28;
              return `
                <rect class="chart-like-tag-bg" x="${tagX}" y="${tagY}" width="${tagWidth}" height="22" rx="11" />
                <circle class="chart-like-point" cx="${tagX + 12}" cy="${tagY + 11}" r="4" />
                <text class="chart-like-label" x="${tagX + 24}" y="${tagY + 15}">${escapeSvgText(entry.title)} +${siteData.formatCount(entry.count)}</text>
              `;
            })
            .join("")}
        </g>
      `;
    })
    .join("");
  const hasLikes = [...likesByDay.values()].some((dayLikes) => dayLikes.size > 0);

  chart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Daily visits and post like events since 2026/5/26">
      ${[0, 0.25, 0.5, 0.75, 1]
        .map((tick) => {
          const y = pad.top + innerHeight * tick;
          return `<line class="chart-grid-line" x1="${pad.left}" y1="${y}" x2="${pad.left + innerWidth}" y2="${y}" />`;
        })
        .join("")}
      <polygon class="chart-visit-area" points="${areaPoints}" />
      <polyline class="chart-visit-line" points="${points}" />
      ${days
        .map((day, index) => {
          const x = xForIndex(index);
          const y = yForCount(day.count);
          return `
            <circle class="chart-visit-point" cx="${x}" cy="${y}" r="5" />
            <text class="chart-visit-value" x="${x}" y="${Math.max(pad.top + 18, y - 14)}" text-anchor="middle">${siteData.formatCount(day.count)}</text>
            <text class="chart-axis-label" x="${x}" y="${height - 24}" text-anchor="middle">${day.label}</text>
            <text class="chart-axis-sub-label" x="${x}" y="${height - 8}" text-anchor="middle">${siteData.formatCount(day.count)} views</text>
          `;
        })
        .join("")}
      ${likeTags}
      ${
        hasLikes
          ? ""
          : `<text class="chart-empty-label" x="${pad.left}" y="${pad.top + 34}">No post likes recorded in this range.</text>`
      }
    </svg>
  `;
};

renderCombinedChart();

const updateSiteDays = () => {
  if (!siteDays) return;

  const createdAt = new Date(siteDays.dataset.createdAt);
  const diffDays = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 86400000));
  siteDays.textContent = `${diffDays} ${diffDays === 1 ? "day" : "days"}`;
};

updateSiteDays();

const refreshRemoteStats = (stats) => {
  if (!stats) return;

  siteData.setRemoteStats(stats);
  siteVisitState = siteData.getVisitState(localVisitState);
  updateVisitCount();
  renderLikeButtons();
  renderTopLiked();
  renderCombinedChart();
};

const syncRemoteStats = async () => {
  if (!siteStats?.isEnabled()) return;

  try {
    const stats = shouldRecordVisit
      ? await siteStats.recordVisit({
          path: window.location.pathname,
          title: document.title,
        })
      : await siteStats.getStats();
    refreshRemoteStats(stats);
  } catch {
    try {
      refreshRemoteStats(await siteStats.getStats());
    } catch {
      // The local fallback remains usable offline or before deployment.
    }
  }
};

syncRemoteStats();

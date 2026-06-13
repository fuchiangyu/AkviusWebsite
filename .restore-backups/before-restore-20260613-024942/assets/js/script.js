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
const languageStorageKey = "akvius-language";
const validLanguages = ["en", "zh-hans", "zh-hant", "ug-trad", "ug-latn"];

const normalizeSavedLanguage = (language) => {
  if (language === "zh") return "zh-hans";
  if (language === "ug-ar") return "ug-trad";
  return validLanguages.includes(language) ? language : null;
};

const getSavedLanguage = () => {
  try {
    return normalizeSavedLanguage(localStorage.getItem(languageStorageKey));
  } catch {
    return null;
  }
};

const saveLanguage = (language) => {
  try {
    localStorage.setItem(languageStorageKey, language);
  } catch {
    // Language switching should still work when storage is unavailable.
  }
};

let activeLanguage = getSavedLanguage() || "en";

const {
  translations = {},
  languageMeta = { en: { short: "EN", labelKey: "languageEn", htmlLang: "en" } },
  languageGroups = [],
  toTraditionalChinese = (text) => String(text ?? ""),
  uyghurArabicToLatin = (text) => String(text ?? ""),
} = window.AkviusTranslations || {};

const t = (key) => {
  const entry = translations[key];
  if (!entry) return key;
  const english = entry.en || "";
  const simplifiedChinese = entry.zhHans || entry.zh || english;
  const traditionalUyghur = entry.ugTrad || entry.ug || english;

  if (activeLanguage === "zh-hans") return simplifiedChinese;
  if (activeLanguage === "zh-hant") return entry.zhHant || toTraditionalChinese(simplifiedChinese);
  if (activeLanguage === "ug-trad") return traditionalUyghur;
  if (activeLanguage === "ug-latn") return entry.ugLatn || uyghurArabicToLatin(traditionalUyghur);
  return entry.en || "";
};

const translateOptional = (key) => {
  if (!key) return "";
  const translated = t(key);
  return translated && translated !== key ? translated : "";
};

const getLocalizedPostTitle = (post) => {
  const translated = translateOptional(post?.translationKeys?.title);
  if (translated) return translated;
  if (post?.key === "post-chaghatay-dictionary") return t("postDictionaryTitle");
  return post?.title || "";
};

const getLocalizedPostSummary = (post) => {
  const translated = translateOptional(post?.translationKeys?.summary);
  if (translated) return translated;
  if (post?.key === "post-chaghatay-dictionary") return t("postDictionaryOverviewText");
  return post?.summary || "Latest published post.";
};

const getLocalizedTagTitle = (tag) => {
  const tagKey = String(tag || "").trim().toLowerCase();
  const translationKey =
    {
      chaghatay: "tagChaghatay",
      dictionary: "tagDictionary",
      tool: "tagTool",
      project: "tagProject",
    }[tagKey] || "";
  const translated = translationKey ? t(translationKey) : "";
  return translated && translated !== translationKey ? translated : String(tag || "");
};

const getLocalizedVersionNote = (version) => {
  const key = String(version?.key || "").replace(/-/g, "").toUpperCase();
  const translationKey = key ? `log${key}Text` : "";
  const translated = translationKey ? t(translationKey) : "";
  if (translated && translated !== translationKey) return translated;
  return (version?.notes || []).join("; ");
};

const getLocalizedCountLabel = (key, count) => {
  if (key === "tags") return t(count === 1 ? "unitTag" : "unitTags");
  if (key === "tools") return t(count === 1 ? "unitItem" : "unitItems");
  if (key === "logs") return t(count === 1 ? "unitLog" : "unitLogs");
  return t(count === 1 ? "unitPost" : "unitPosts");
};

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
    <a href="${localHref("index.html")}" data-page="home">${t("navHome")}</a>
    <div class="nav-item nav-item-has-panel">
      <button class="nav-panel-trigger" type="button" data-page="categories" data-href="${localHref("categories/index.html")}" aria-expanded="false">${t("navCategories")}</button>
      <div class="nav-panel" aria-label="Category navigation">
        <a class="nav-panel-overview" href="${localHref("categories/index.html")}">${t("navAllCategories")}</a>
        <div class="nav-panel-group">
          <a class="nav-panel-title" href="${localHref("categories/languages/index.html")}">${t("navLanguages")}</a>
          <a href="${localHref("categories/languages/uyghur/index.html")}">${t("navUyghur")}</a>
          <a href="${localHref("categories/languages/turkish/index.html")}">${t("navTurkish")}</a>
          <a href="${localHref("categories/languages/chaghatay/index.html")}">${t("navChaghatay")}</a>
        </div>
        <div class="nav-panel-group">
          <a class="nav-panel-title" href="${localHref("categories/music/index.html")}">${t("navMusic")}</a>
          <a href="${localHref("categories/music/posts/index.html")}">${t("navPosts")}</a>
        </div>
        <div class="nav-panel-group">
          <a class="nav-panel-title" href="${localHref("categories/notes/index.html")}">${t("navNotes")}</a>
          <a href="${localHref("categories/notes/index.html")}">${t("navPosts")}</a>
        </div>
        <div class="nav-panel-group">
          <a class="nav-panel-title" href="${localHref("categories/tools/index.html")}">${t("navTools")}</a>
          <a href="${localHref("categories/tools/apps/chaghatay-dictionary/index.html")}">${t("navDictionary")}</a>
        </div>
        <div class="nav-panel-group">
          <a class="nav-panel-title" href="${localHref("categories/tags/index.html")}">${t("navTags")}</a>
          <a href="${localHref("categories/tags/chaghatay/index.html")}">#${t("tagChaghatay")}</a>
          <a href="${localHref("categories/tags/dictionary/index.html")}">#${t("tagDictionary")}</a>
          <a href="${localHref("categories/tags/tool/index.html")}">#${t("tagTool")}</a>
        </div>
        <a class="nav-panel-overview" href="${localHref("categories/logs/index.html")}">${t("navLogs")}</a>
      </div>
    </div>
    <a href="${localHref("stats/index.html")}" data-page="stats">${t("navStats")}</a>
    <a href="${localHref("timeline/index.html")}" data-page="timeline">${t("navTimeline")}</a>
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

const languageSwitcherMarkup = () => `
  <div class="language-switcher">
    <button class="language-toggle" type="button" aria-label="${t("languageLabel")}" aria-expanded="false">
      <span>${languageMeta[activeLanguage].short}</span>
    </button>
    <div class="language-menu" role="menu" aria-label="${t("languageLabel")}">
      <button type="button" role="menuitemradio" data-language-option="en" aria-checked="${activeLanguage === "en"}">
        <strong>${languageMeta.en.short}</strong>
        <span>${t(languageMeta.en.labelKey)}</span>
      </button>
      ${languageGroups
        .map(
          (group) => `
            <div class="language-menu-group">
              <span class="language-menu-group-label">${t(group.labelKey)}</span>
              <div class="language-menu-options">
                ${group.languages
                  .map(
                    (language) => `
                      <button type="button" role="menuitemradio" data-language-option="${language}" aria-checked="${language === activeLanguage}">
                        <strong>${languageMeta[language].short}</strong>
                        <span>${t(languageMeta[language].labelKey)}</span>
                      </button>
                    `,
                  )
                  .join("")}
              </div>
            </div>
          `,
        )
        .join("")}
    </div>
  </div>
`;

const renderLanguageSwitcher = () => {
  if (!themeToggle || document.querySelector(".language-switcher")) return;
  themeToggle.insertAdjacentHTML("beforebegin", languageSwitcherMarkup());

  const switcher = document.querySelector(".language-switcher");
  const toggle = switcher?.querySelector(".language-toggle");

  toggle?.addEventListener("click", () => {
    const isOpen = switcher.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  switcher?.querySelectorAll("[data-language-option]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextLanguage = button.dataset.languageOption;
      if (!validLanguages.includes(nextLanguage)) return;
      saveLanguage(nextLanguage);
      window.location.reload();
    });
  });

  document.addEventListener("click", (event) => {
    if (!switcher?.contains(event.target)) {
      switcher?.classList.remove("open");
      toggle?.setAttribute("aria-expanded", "false");
    }
  });
};

renderLanguageSwitcher();

const staticTextBindings = [
  [".hero-copy .eyebrow", "homeEyebrow"],
  [".hero-copy h1", "homeTitle"],
  [".hero-copy .hero-text", "homeText"],
  [".hero-actions .primary-action", "randomEntry"],
  [".hero-actions .secondary-action", "categoriesButton"],
  [".hero-status > span", "location"],
  [".visual-label", "personalCard"],
  [".mood-status p", "mood"],
  [".khagan-name > span", "khaganLabel"],
  [".template-category-index .section-heading .eyebrow", "categoriesEyebrow"],
  [".template-category-index .section-heading .page-title", "categoriesTitle"],
  [".site-search-field span", "searchLabel"],
  ["#languages h3", "navLanguages"],
  ["#languages > p", "categoryLanguagesDesc"],
  ["#music h3", "navMusic"],
  ["#music > p", "categoryMusicDesc"],
  ["#notes h3", "navNotes"],
  ["#notes > p", "categoryNotesDesc"],
  ["#tools h3", "navTools"],
  ["#tools > p", "categoryToolsDesc"],
  ["#tags h3", "navTags"],
  ["#tags > p", "categoryTagsDesc"],
  ["#logs h3", "navLogs"],
  ["#logs > p", "categoryLogsDesc"],
  [".stats-copy .eyebrow", "statsEyebrow"],
  [".stats-copy .page-title", "statsTitle"],
  [".stats-copy > p", "statsText"],
  ['[href$="visits/index.html"] > p', "totalVisits"],
  ['[href*="timeline/index.html"][aria-label="Open timeline"] > p', "sinceFounded"],
  ["[data-current-version-card] > p", "currentVersion"],
  ["[data-top-liked-card] > p", "mostLikedPost"],
  ["[data-top-liked-title]", "noLikedPost"],
  ["[data-trending-tag-card] > p", "trendingTag"],
  ["[data-trending-tag-meta]", "noTagData"],
  ["[data-recent-update-card] > p", "recentUpdate"],
  ["[data-recent-update-title]", "noPostYet"],
  [".dashboard-feature-head .eyebrow", "newUpdatePost"],
  [".timeline-intro .eyebrow", "timelineEyebrow"],
  [".timeline-intro .page-title", "timelineTitle"],
  [".timeline-intro > p", "timelineText"],
  [".timeline-updates > span", "newUpdates"],
  [".stats-panel-heading > span", "statsVisitsTitle"],
  [".chart-date-control > span", "statsDateLabel"],
  ["[data-log-page-title]", "logPageTitle"],
  [".article-toc-label", "contents"],
  ['.article-toc-panel a[href="#overview"]', "postDictionaryOverview"],
  ['.article-toc-panel a[href="#notes"]', "postDictionaryNotes"],
  ['.article-toc-panel a[href="#features"]', "postDictionaryFeatures"],
  ['.article-toc-panel a[href="#links"]', "postDictionaryLinks"],
  [".article-reading-header .page-title", "postDictionaryTitle"],
  ['.article-story-section#overview h2', "postDictionaryOverview"],
  ['.article-story-section#overview p', "postDictionaryOverviewText"],
  ['.article-story-section#notes h2', "postDictionaryNotes"],
  ['.article-story-section#notes p:nth-of-type(1)', "postDictionaryNotesText1"],
  ['.article-story-section#notes p:nth-of-type(2)', "postDictionaryNotesText2"],
  ['.article-story-section#notes p:nth-of-type(3)', "postDictionaryNotesText3"],
  ['.article-story-section#features h2', "postDictionaryFeatures"],
  ['.article-story-section#features li:nth-of-type(1)', "postDictionaryFeatureSearch"],
  ['.article-story-section#features li:nth-of-type(2)', "postDictionaryFeatureConverter"],
  ['.article-story-section#links h2', "postDictionaryLinks"],
  [".article-link-card strong", "postDictionaryTool"],
  [".article-link-card span", "postDictionaryToolText"],
];

const applyLanguage = () => {
  const meta = languageMeta[activeLanguage] || languageMeta.en;
  document.documentElement.lang = meta.htmlLang;
  document.documentElement.dataset.language = activeLanguage;

  document.querySelectorAll(".language-toggle span").forEach((node) => {
    node.textContent = meta.short;
  });

  document.querySelectorAll("[data-language-option]").forEach((button) => {
    button.setAttribute("aria-checked", String(button.dataset.languageOption === activeLanguage));
  });

  staticTextBindings.forEach(([selector, key]) => {
    document.querySelectorAll(selector).forEach((node) => {
      node.textContent = t(key);
    });
  });

  document.querySelectorAll("[data-text-key]").forEach((node) => {
    node.textContent = t(node.dataset.textKey);
  });

  document.querySelectorAll("[data-site-search]").forEach((input) => {
    input.setAttribute("placeholder", t("searchPlaceholder"));
  });

  document.querySelectorAll("[data-post-title]").forEach((node) => {
    const post = siteData.postTargets.find((item) => item.key === node.dataset.postTitle);
    node.textContent = getLocalizedPostTitle(post);
  });

  document.querySelectorAll("[data-post-summary]").forEach((node) => {
    const post = siteData.postTargets.find((item) => item.key === node.dataset.postSummary);
    node.textContent = getLocalizedPostSummary(post);
  });

  document.querySelectorAll("[data-tag-title]").forEach((node) => {
    node.textContent = `#${getLocalizedTagTitle(node.dataset.tagTitle)}`;
  });

  document.querySelectorAll("[data-tag-heading]").forEach((node) => {
    node.textContent = `#${getLocalizedTagTitle(node.dataset.tagHeading)} ${t("navPosts")}`;
  });

  document.querySelectorAll("[data-post-count-label]").forEach((node) => {
    const count = Number(node.dataset.postCountLabel || 0);
    node.textContent = `${siteData.formatCount(count)} ${t(count === 1 ? "unitPost" : "unitPosts")}`;
  });

  document.querySelectorAll("[data-version-note]").forEach((node) => {
    const version = siteData.versions.find((item) => item.key === node.dataset.versionNote);
    node.textContent = getLocalizedVersionNote(version);
  });
};

applyLanguage();

const shouldRecordVisit = (() => {
  try {
    if (sessionStorage.getItem(visitSessionKey)) return false;
    sessionStorage.setItem(visitSessionKey, "1");
    return true;
  } catch {
    return true;
  }
})();

let siteVisitState = siteData.getVisitState();

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

document.querySelectorAll(".article-toc").forEach((toc) => {
  const toggle = toc.querySelector(".article-toc-toggle");
  const setTocOpen = (open) => {
    toc.classList.toggle("is-open", open);
    toc.classList.toggle("is-collapsed-by-click", !open);
    toc.setAttribute("aria-expanded", String(open));
    toggle?.setAttribute("aria-expanded", String(open));
    if (!open) toggle?.blur();
  };

  toggle?.addEventListener("click", () => {
    setTocOpen(!toc.classList.contains("is-open"));
  });

  toc.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setTocOpen(true));
  });

  toc.addEventListener("pointerleave", () => {
    toc.classList.remove("is-collapsed-by-click");
  });
});

const renderCategoryCounts = (counts) => {
  document.querySelectorAll("[data-category-count]").forEach((stat) => {
    const key = stat.dataset.categoryCount;
    const count = counts[key] ?? 0;
    const label = getLocalizedCountLabel(key, count);
    const wrapper = stat.closest("strong");

    if (wrapper?.querySelector("[data-category-count-label]")) {
      wrapper.textContent = `${siteData.formatCount(count)} ${label}`;
      return;
    }

    stat.textContent = siteData.formatCount(count);
  });

  document.querySelectorAll("[data-category-count-label]").forEach((label) => {
    const key = label.dataset.categoryCountLabel;
    const count = counts[key] ?? 0;
    label.textContent = getLocalizedCountLabel(key, count);
  });
};

if (document.querySelector("[data-category-count]")) {
  renderCategoryCounts(siteData.categoryCounts);
}

const siteSearchInput = document.querySelector("[data-site-search]");
const siteSearchResults = document.querySelector("[data-site-search-results]");
const escapeSearchHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getLocalizedSearchItem = (item) => {
  const categoryKey = String(item.key || "").replace(/^category-/, "");
  const kindKey =
    {
      Category: "navCategories",
      Tag: "navTags",
      Post: "navPosts",
      Tool: "navTools",
      Log: "navLogs",
    }[item.kind] || "";

  if (item.key === "post-chaghatay-dictionary") {
    return {
      kind: kindKey ? t(kindKey) : item.kind,
      title: getLocalizedPostTitle(siteData.postTargets.find((post) => post.key === item.key)),
      description: getLocalizedPostSummary(siteData.postTargets.find((post) => post.key === item.key)),
    };
  }

  if (item.key === "tool-chaghatay-dictionary") {
    return {
      kind: kindKey ? t(kindKey) : item.kind,
      title: t("navDictionary"),
      description: t("toolDictionaryDesc"),
    };
  }

  if (item.key?.startsWith("tag-")) {
    const tag = item.key.replace(/^tag-/, "");
    const count = siteData.tagIndex?.[tag]?.posts?.length || 0;
    return {
      kind: kindKey ? t(kindKey) : item.kind,
      title: `#${getLocalizedTagTitle(tag)}`,
      description: `${siteData.formatCount(count)} ${t(count === 1 ? "unitPost" : "unitPosts")}`,
    };
  }

  if (item.key?.startsWith("category-")) {
    const titleKey =
      {
        languages: "navLanguages",
        music: "navMusic",
        notes: "navNotes",
        tools: "navTools",
        tags: "navTags",
        logs: "navLogs",
      }[categoryKey] || "";
    const descriptionKey =
      {
        languages: "categoryLanguagesDesc",
        music: "categoryMusicDesc",
        notes: "categoryNotesDesc",
        tools: "categoryToolsDesc",
        tags: "categoryTagsDesc",
        logs: "categoryLogsDesc",
      }[categoryKey] || "";
    return {
      kind: kindKey ? t(kindKey) : item.kind,
      title: titleKey ? t(titleKey) : item.title,
      description: descriptionKey ? t(descriptionKey) : item.description,
    };
  }

  if (item.key?.startsWith("log-")) {
    const version = siteData.versions.find((entry) => `log-${entry.key}` === item.key);
    return {
      kind: kindKey ? t(kindKey) : item.kind,
      title: item.title,
      description: getLocalizedVersionNote(version),
    };
  }

  return {
    kind: kindKey ? t(kindKey) : item.kind,
    title: item.title,
    description: item.description,
  };
};

const renderSiteSearch = () => {
  if (!siteSearchInput || !siteSearchResults) return;

  const query = siteSearchInput.value.trim().toLowerCase();
  const terms = query.split(/\s+/).filter(Boolean);

  if (!terms.length) {
    siteSearchResults.hidden = true;
    siteSearchResults.innerHTML = "";
    return;
  }

  const results = (siteData.searchIndex || [])
    .map((item) => {
      const display = getLocalizedSearchItem(item);
      const title = `${item.title || ""} ${display.title || ""}`.toLowerCase();
      const text = `${item.searchText || ""} ${item.description || ""} ${display.kind || ""} ${display.description || ""}`.toLowerCase();
      const matched = terms.every((term) => title.includes(term) || text.includes(term));
      if (!matched) return null;

      const titleScore = terms.reduce((score, term) => score + (title.includes(term) ? 2 : 0), 0);
      const textScore = terms.reduce((score, term) => score + (text.includes(term) ? 1 : 0), 0);
      return { ...item, display, score: titleScore + textScore };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, 8);

  siteSearchResults.hidden = false;

  if (!results.length) {
    siteSearchResults.innerHTML = `<p class="site-search-empty">${escapeSearchHtml(t("noSearchResults"))}</p>`;
    return;
  }

  siteSearchResults.innerHTML = results
    .map((item) => {
      const display = item.display || getLocalizedSearchItem(item);
      return `
        <a class="site-search-result" href="${localHref(item.href)}">
          <span>${escapeSearchHtml(display.kind)}</span>
          <strong>${escapeSearchHtml(display.title)}</strong>
          <em>${escapeSearchHtml(display.description)}</em>
        </a>
      `;
    })
    .join("");
};

siteSearchInput?.addEventListener("input", renderSiteSearch);

document.querySelectorAll("[data-sort-posts]").forEach((list) => {
  [...list.querySelectorAll(".article-card")]
    .sort((a, b) => {
      const aTime = new Date(a.querySelector("time")?.dateTime || 0).getTime();
      const bTime = new Date(b.querySelector("time")?.dateTime || 0).getTime();
      return bTime - aTime;
    })
    .forEach((card) => list.appendChild(card));
});

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
  button.setAttribute(
    "aria-label",
    Number.isFinite(Number(count)) ? `Like this page. ${Number(count).toLocaleString("en-US")} likes` : "Like this page. Likes unavailable",
  );
};

const renderLikeButtons = () => {
  likeButtons.forEach((button) => {
    const key = button.dataset.likeKey;
    renderLikeButton(button, siteData.getLikeCount(key));
  });
};

renderLikeButtons();

likeButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const key = button.dataset.likeKey;
    const target = siteData.pageLikeTargets[key] || {};

    button.classList.remove("like-button-pulse");
    void button.offsetWidth;
    button.classList.add("like-button-pulse");
    window.setTimeout(() => button.classList.remove("like-button-pulse"), 360);

    try {
      const stats = await siteStats?.recordLike({
        key,
        title: target.title || key,
        href: target.href || window.location.pathname,
        kind: target.kind || "page",
      });
      if (stats) {
        siteData.setRemoteStats(stats);
        siteVisitState = siteData.getVisitState();
        renderLikeButtons();
        updateVisitCount();
        renderTopLiked();
        renderTrendingTag();
        renderCombinedChart();
      }
    } catch {
      siteData.setRemoteStats(null);
      renderLikeButtons();
      updateVisitCount();
      renderTopLiked();
      renderTrendingTag();
      renderCombinedChart();
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
  siteVisitState = siteData.getVisitState();
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
  if (!top) {
    document.querySelectorAll("[data-top-liked-card]").forEach((card) => {
      card.removeAttribute("href");
      card.setAttribute("aria-label", t("noLikedPost"));
    });

    document.querySelectorAll("[data-top-liked-count]").forEach((node) => {
      node.textContent = "/";
    });

    document.querySelectorAll("[data-top-liked-title]").forEach((node) => {
      node.textContent = t("noLikedPost");
    });

    return;
  }

  document.querySelectorAll("[data-top-liked-card]").forEach((card) => {
    card.href = resolveThemeHref(top.href);
  });

  document.querySelectorAll("[data-top-liked-count]").forEach((node) => {
    node.textContent = siteData.formatCount(top.count);
  });

  document.querySelectorAll("[data-top-liked-title]").forEach((node) => {
    node.textContent = top.key === "post-chaghatay-dictionary" ? t("postDictionaryTitle") : top.title;
  });
};

renderTopLiked();

const renderTrendingTag = () => {
  const tag = siteData.getTrendingTag();
  if (!tag) {
    document.querySelectorAll("[data-trending-tag-card]").forEach((card) => {
      card.href = resolveThemeHref("categories/tags/index.html");
    });

    document.querySelectorAll("[data-trending-tag]").forEach((node) => {
      node.textContent = "#";
    });

    document.querySelectorAll("[data-trending-tag-meta]").forEach((node) => {
      node.textContent = t("noTagData");
    });

    return;
  }

  document.querySelectorAll("[data-trending-tag-card]").forEach((card) => {
    card.href = resolveThemeHref(tag.href);
  });

  document.querySelectorAll("[data-trending-tag]").forEach((node) => {
    node.textContent = `#${getLocalizedTagTitle(tag.title)}`;
  });

  document.querySelectorAll("[data-trending-tag-meta]").forEach((node) => {
    const score = Number(tag.score || 0);
    node.textContent =
      score > 0
        ? `${siteData.formatCount(score)} ${t("statsLikesUnit")}`
        : `${tag.count} ${t(tag.count === 1 ? "unitPost" : "unitPosts")}`;
  });
};

const renderRecentUpdate = () => {
  const post = siteData.getRecentPost();
  if (!post) {
    document.querySelectorAll("[data-recent-update-card]").forEach((card) => {
      card.removeAttribute("href");
    });

    document.querySelectorAll("[data-recent-update-title], [data-new-update-post-title]").forEach((node) => {
      node.textContent = t("noPostYet");
    });

    document.querySelectorAll("[data-recent-update-date], [data-new-update-post-date]").forEach((node) => {
      node.textContent = "/";
    });

    document.querySelectorAll("[data-new-update-post-summary]").forEach((node) => {
      node.textContent = "/";
    });

    document.querySelectorAll("[data-new-update-post-tags]").forEach((node) => {
      node.innerHTML = "";
    });

    return;
  }

  document.querySelectorAll("[data-recent-update-card]").forEach((card) => {
    card.href = resolveThemeHref(post.href);
  });

  document.querySelectorAll("[data-recent-update-title]").forEach((node) => {
    node.textContent = getLocalizedPostTitle(post);
  });

  document.querySelectorAll("[data-recent-update-date]").forEach((node) => {
    node.textContent = post.publishedAt ? formatDisplayDate(post.publishedAt) : "Recent update";
  });

  document.querySelectorAll("[data-new-update-post-card]").forEach((card) => {
    card.href = resolveThemeHref(post.href);
  });

  document.querySelectorAll("[data-new-update-post-title]").forEach((node) => {
    node.textContent = getLocalizedPostTitle(post);
  });

  document.querySelectorAll("[data-new-update-post-date]").forEach((node) => {
    node.textContent = post.publishedAt ? formatDisplayDate(post.publishedAt) : "/";
    if (post.publishedAt) node.setAttribute("datetime", post.publishedAt);
  });

  document.querySelectorAll("[data-new-update-post-summary]").forEach((node) => {
    node.textContent = getLocalizedPostSummary(post);
  });

  document.querySelectorAll("[data-new-update-post-tags]").forEach((node) => {
    node.innerHTML = (post.tags || [])
      .map((tag) => `<span>#${escapeSearchHtml(getLocalizedTagTitle(tag))}</span>`)
      .join("");
  });
};

renderTrendingTag();
renderRecentUpdate();

const renderCurrentVersion = () => {
  const version = siteData.getCurrentVersion?.();
  if (!version) return;

  document.querySelectorAll("[data-current-version-card]").forEach((card) => {
    card.href = resolveThemeHref(version.href);
  });

  document.querySelectorAll("[data-current-version]").forEach((node) => {
    node.textContent = version.title;
  });
};

renderCurrentVersion();

const renderTimelineUpdates = () => {
  const list = document.querySelector("[data-timeline-updates]");
  if (!list) return;

  const posts = [...siteData.postTargets]
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
    .slice(0, 5);

  if (!posts.length) {
    list.innerHTML = '<p class="timeline-empty">/</p>';
    return;
  }

  list.innerHTML = posts
    .map(
      (post) => `
        <a class="timeline-update-item" href="${resolveThemeHref(post.href)}">
          <strong>${escapeSearchHtml(getLocalizedPostTitle(post))}</strong>
          <time datetime="${post.publishedAt || ""}">${post.publishedAt ? formatDisplayDate(post.publishedAt) : "/"}</time>
        </a>
      `,
    )
    .join("");
};

renderTimelineUpdates();

const renderTimeline = () => {
  const track = document.querySelector("[data-timeline-track]");
  if (!track) return;
  track.querySelectorAll(".timeline-node, .timeline-empty").forEach((node) => node.remove());

  const posts = [
    ...siteData.postTargets,
    ...(siteData.versions || []).map((version) => ({
      ...version,
      category: t("navLogs"),
      title: version.title,
    })),
  ].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  track.dataset.count = String(posts.length);

  if (!posts.length) {
    track.insertAdjacentHTML(
      "beforeend",
      `<p class="timeline-empty">${escapeSearchHtml(t("timelineEmpty"))}</p>`,
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
              <strong>${escapeSearchHtml(getLocalizedPostTitle(post))}</strong>
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

  const dateInput = document.querySelector("[data-chart-end-date]");
  const startDate = new Date("2026-05-26T00:00:00+08:00");
  const today = new Date();
  const toDateInputValue = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const parseLocalDate = (value) => {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00+08:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const clampDate = (date) => {
    if (!date || date < startDate) return new Date(startDate);
    if (date > today) return new Date(today);
    return date;
  };

  if (dateInput) {
    dateInput.min = toDateInputValue(startDate);
    dateInput.max = toDateInputValue(today);
    if (!dateInput.value) dateInput.value = toDateInputValue(today);
  }

  if (!siteData.hasRemoteStats()) {
    chart.innerHTML = `
      <div class="chart-unavailable">
        <strong>/</strong>
        <span>${escapeSearchHtml(t("statsUnavailable"))}</span>
      </div>
    `;
    return;
  }

  siteVisitState = siteData.getVisitState();
  const history = siteVisitState.history || {};
  const events = siteData.getLikeEvents();
  const escapeSvgText = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const escapeHtml = (value) =>
    escapeSvgText(value)
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  const keyForDate = (date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);

  const endDate = clampDate(parseLocalDate(dateInput?.value) || today);
  if (dateInput) dateInput.value = toDateInputValue(endDate);

  const displayStartDate = new Date(endDate);
  displayStartDate.setDate(endDate.getDate() - 9);
  if (displayStartDate < startDate) displayStartDate.setTime(startDate.getTime());

  const spanDays = Math.max(1, Math.floor((endDate.getTime() - displayStartDate.getTime()) / 86400000) + 1);
  const days = [...Array(spanDays)].map((_, index) => {
    const date = new Date(displayStartDate);
    date.setDate(displayStartDate.getDate() + index);
    const key = keyForDate(date);
    return { key, label: formatDisplayDate(key), count: Number(history[key] || 0) };
  });

  const width = 1120;
  const height = 500;
  const pad = { top: 48, right: 44, bottom: 90, left: 58 };
  const innerWidth = width - pad.left - pad.right;
  const innerHeight = height - pad.top - pad.bottom;
  const xForIndex = (index) => pad.left + (innerWidth / Math.max(1, days.length - 1)) * index;
  const likesByDay = new Map(days.map((day) => [day.key, new Map()]));

  events.forEach((event) => {
    const date = new Date(event.time);
    if (Number.isNaN(date.getTime())) return;

    const key = keyForDate(date);
    const dayLikes = likesByDay.get(key);
    if (!dayLikes) return;

    const postKey = event.key || event.title || "unknown";
    const target = siteData.pageLikeTargets?.[postKey] || {};
    const existing = dayLikes.get(postKey) || {
      title: event.title || target.title || "Unknown post",
      href: event.href || target.href || "",
      count: 0,
    };
    existing.count += Number(event.count || 1);
    dayLikes.set(postKey, existing);
  });

  days.forEach((day) => {
    day.likes = [...(likesByDay.get(day.key)?.values() || [])].reduce((sum, entry) => sum + entry.count, 0);
  });

  const max = Math.max(1, ...days.flatMap((day) => [day.count, day.likes]));
  const yForCount = (count) => pad.top + innerHeight - (count / max) * innerHeight;
  const visitPoints = days.map((day, index) => `${xForIndex(index)},${yForCount(day.count)}`).join(" ");
  const likePoints = days.map((day, index) => `${xForIndex(index)},${yForCount(day.likes)}`).join(" ");
  const areaPoints = `${pad.left},${pad.top + innerHeight} ${visitPoints} ${pad.left + innerWidth},${pad.top + innerHeight}`;
  const hasLikes = days.some((day) => day.likes > 0);
  const tooltipOverlays = days
    .map((day, index) => {
      const entries = [...(likesByDay.get(day.key)?.values() || [])].sort((a, b) => b.count - a.count);
      if (!entries.length) return "";

      const x = xForIndex(index);
      const y = yForCount(day.likes);
      const left = (x / width) * 100;
      const top = (y / height) * 100;

      return `
        <div class="chart-like-hotspot" style="left: ${left}%; top: ${top}%;" data-like-hotspot>
          <button class="chart-like-hotspot-button" type="button" aria-label="${escapeHtml(day.label)} ${escapeHtml(t("statsLikesLegend"))}" aria-expanded="false">
            ${siteData.formatCount(day.likes)}
          </button>
          <div class="chart-like-tooltip" role="tooltip">
            <strong>${escapeHtml(day.label)} · ${siteData.formatCount(day.likes)} ${escapeHtml(t("statsLikesUnit"))}</strong>
            <div class="chart-like-tooltip-list">
              ${entries
                .map((entry) => {
                  const href = entry.href ? resolveThemeHref(entry.href) : "#";
                  return `<a href="${escapeHtml(href)}"><span>${escapeHtml(entry.title)}</span><em>+${siteData.formatCount(entry.count)}</em></a>`;
                })
                .join("")}
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  chart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(t("statsVisitsTitle"))}">
      <g class="chart-legend" aria-hidden="true">
        <circle class="chart-visit-point" cx="${pad.left}" cy="18" r="5" />
            <text class="chart-legend-label" x="${pad.left + 14}" y="22">${escapeSvgText(t("statsVisitsLegend"))}</text>
        <circle class="chart-like-point" cx="${pad.left + 92}" cy="18" r="5" />
        <text class="chart-legend-label" x="${pad.left + 106}" y="22">${escapeSvgText(t("statsLikesLegend"))}</text>
      </g>
      ${[0, 0.25, 0.5, 0.75, 1]
        .map((tick) => {
          const y = pad.top + innerHeight * tick;
          return `<line class="chart-grid-line" x1="${pad.left}" y1="${y}" x2="${pad.left + innerWidth}" y2="${y}" />`;
        })
        .join("")}
      <polygon class="chart-visit-area" points="${areaPoints}" />
      <polyline class="chart-visit-line" points="${visitPoints}" />
      <polyline class="chart-like-line" points="${likePoints}" />
      ${days
        .map((day, index) => {
          const x = xForIndex(index);
          const visitY = yForCount(day.count);
          const likeY = yForCount(day.likes);
          return `
            <circle class="chart-visit-point" cx="${x}" cy="${visitY}" r="5" />
            <circle class="chart-like-point" cx="${x}" cy="${likeY}" r="5" />
            <text class="chart-visit-value" x="${x}" y="${Math.max(pad.top + 18, visitY - 14)}" text-anchor="middle">${siteData.formatCount(day.count)}</text>
            <text class="chart-like-value" x="${x}" y="${Math.max(pad.top + 34, likeY - 14)}" text-anchor="middle">${siteData.formatCount(day.likes)}</text>
            <text class="chart-axis-label" x="${x}" y="${height - 24}" text-anchor="middle">${day.label}</text>
            <text class="chart-axis-sub-label" x="${x}" y="${height - 8}" text-anchor="middle">${siteData.formatCount(day.count)} ${escapeSvgText(t("statsViewsUnit"))} · ${siteData.formatCount(day.likes)} ${escapeSvgText(t("statsLikesUnit"))}</text>
          `;
        })
        .join("")}
      ${
        hasLikes
          ? ""
          : `<text class="chart-empty-label" x="${pad.left}" y="${pad.top + 34}">${escapeSvgText(t("statsNoLikesRange"))}</text>`
      }
    </svg>
    ${tooltipOverlays}
  `;

  chart.querySelectorAll("[data-like-hotspot]").forEach((hotspot) => {
    const button = hotspot.querySelector("button");
    button?.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = hotspot.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(isOpen));
      chart.querySelectorAll("[data-like-hotspot].is-open").forEach((other) => {
        if (other === hotspot) return;
        other.classList.remove("is-open");
        other.querySelector("button")?.setAttribute("aria-expanded", "false");
      });
    });
  });
};

renderCombinedChart();

document.querySelector("[data-chart-end-date]")?.addEventListener("change", renderCombinedChart);

document.addEventListener("click", (event) => {
  if (event.target.closest?.("[data-like-hotspot]")) return;
  document.querySelectorAll("[data-like-hotspot].is-open").forEach((hotspot) => {
    hotspot.classList.remove("is-open");
    hotspot.querySelector("button")?.setAttribute("aria-expanded", "false");
  });
});

const updateSiteDays = () => {
  if (!siteDays) return;

  const createdAt = new Date(siteDays.dataset.createdAt);
  const diffDays = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 86400000));
  siteDays.textContent = `${diffDays} ${t(diffDays === 1 ? "unitDay" : "unitDays")}`;
};

updateSiteDays();

const refreshRemoteStats = (stats) => {
  siteData.setRemoteStats(stats);
  siteVisitState = siteData.getVisitState();
  updateVisitCount();
  renderLikeButtons();
  renderTopLiked();
  renderTrendingTag();
  renderCombinedChart();
};

const syncRemoteStats = async () => {
  if (!siteStats?.isEnabled()) {
    refreshRemoteStats(null);
    return;
  }

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
      refreshRemoteStats(null);
    }
  }
};

syncRemoteStats();

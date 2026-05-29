const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const sectionLinks = [...document.querySelectorAll(".nav-links a")];
const currentPage = document.body.dataset.page;
const themeToggle = document.querySelector(".theme-toggle");
const randomLink = document.querySelector("[data-random-link]");
const themeStorageKey = "akvius-theme";
const themeParamKey = "theme";
const validThemes = ["light", "dark"];

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

navToggle?.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

themeToggle?.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  saveTheme(nextTheme);
});

sectionLinks.forEach((link) => {
  link.classList.toggle("active", link.dataset.page === currentPage);

  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

document.querySelectorAll('a[href$=".html"], a[href*=".html#"], a[href*=".html?"]').forEach((link) => {
  link.addEventListener("click", () => {
    link.href = withCurrentTheme(link.getAttribute("href"));
  });
});

randomLink?.addEventListener("click", (event) => {
  const targets = [
    "pages/category-languages.html",
    "pages/category-music.html",
    "pages/category-tools.html",
    "pages/category-notes.html",
    "pages/timeline.html",
    "pages/about.html",
  ];
  const target = withCurrentTheme(targets[Math.floor(Math.random() * targets.length)]);

  event.preventDefault();
  window.location.href = target;
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
  const formatted = `${value.year}-${value.month}-${value.day} ${value.hour}:${value.minute}:${value.second}`;

  liveClock.textContent = formatted;
  liveClock.setAttribute("datetime", now.toISOString());
};

updateLiveClock();
setInterval(updateLiveClock, 1000);

const updateVisitCount = () => {
  if (!visitCount) return;

  const storageKey = "akvius-total-visits";
  let visits = 1280;

  try {
    visits = Number(localStorage.getItem(storageKey) || visits) + 1;
    localStorage.setItem(storageKey, String(visits));
  } catch {
    visits += 1;
  }

  visitCount.textContent = visits.toLocaleString("en-US");
};

updateVisitCount();

const updateSiteDays = () => {
  if (!siteDays) return;

  const createdAt = new Date(siteDays.dataset.createdAt);
  const diffDays = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 86400000));
  siteDays.textContent = `${diffDays} ${diffDays === 1 ? "day" : "days"}`;
};

updateSiteDays();

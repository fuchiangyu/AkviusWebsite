const bankSelect = document.querySelector("#bank-select");
const levelList = document.querySelector("#level-list");
const bankDescription = document.querySelector("#bank-description");
const activeTitle = document.querySelector("#active-title");
const totalCount = document.querySelector("#total-count");
const knownCount = document.querySelector("#known-count");
const fuzzyCount = document.querySelector("#fuzzy-count");
const progressRate = document.querySelector("#progress-rate");
const onlyDueInput = document.querySelector("#only-due");
const shuffleInput = document.querySelector("#shuffle");
const latinToggle = document.querySelector("#latin-toggle");
const searchInput = document.querySelector("#search");
const modeTabs = document.querySelector("#mode-tabs");
const views = document.querySelectorAll(".mode-view");

const cardLevel = document.querySelector("#card-level");
const cardPos = document.querySelector("#card-pos");
const cardUg = document.querySelector("#card-ug");
const wordCard = document.querySelector("#word-card");
const cardZh = document.querySelector("#card-zh");
const cardValency = document.querySelector("#card-valency");
const cardMeaning = document.querySelector("#card-meaning");
const revealButton = document.querySelector("#reveal");
const cardPosition = document.querySelector("#card-position");
const prevCard = document.querySelector("#prev-card");
const nextCard = document.querySelector("#next-card");
const resetSession = document.querySelector("#reset-session");
const clearProgress = document.querySelector("#clear-progress");
const tableBody = document.querySelector("#word-table");
const reviewActions = document.querySelector(".review-actions");
const memoryDonut = document.querySelector("#memory-donut");
const memoryLegend = document.querySelector("#memory-legend");
const levelChart = document.querySelector("#level-chart");

const quizWord = document.querySelector("#quiz-word");
const quizMeta = document.querySelector("#quiz-meta");
const choices = document.querySelector("#choices");
const quizResult = document.querySelector("#quiz-result");
const nextQuiz = document.querySelector("#next-quiz");

let payload = null;
let currentBank = null;
let selectedLevels = new Set();
let filteredWords = [];
let sessionWords = [];
let cardIndex = 0;
let quizCurrent = null;
let mode = "flashcard";
let latinDisplay = localStorage.getItem("uyghur-vocab-latin-display") === "1";
let reviewClickLocked = false;
let quizAnswered = false;
let dragStart = null;
let dragCurrent = null;
let draggingCard = false;

const storageKey = "uyghur-vocab-progress-v1";
const progress = JSON.parse(localStorage.getItem(storageKey) || "{}");
const levelRank = { "①": 1, "②": 2, "③": 3, "未分级": 9 };
const memoryLabels = { known: "Known", fuzzy: "Fuzzy", new: "New" };
const bankDisplay = {
  tq5000: {
    name: "Uyghur Common 5000 Words",
    description: "Grouped by original levels ①②③, with Chinese meanings, parts of speech, Uyghur entries, and valency notes.",
  },
};

function saveProgress() {
  localStorage.setItem(storageKey, JSON.stringify(progress));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[char];
  });
}

function getWordProgress(id) {
  return progress[id] || { score: 0, reviews: 0 };
}

function memoryState(word) {
  const score = getWordProgress(word.id).score;
  if (score >= 4) return "known";
  if (score > 0) return "fuzzy";
  return "new";
}

function setWordProgress(id, delta) {
  const item = getWordProgress(id);
  item.score = Math.max(0, Math.min(5, item.score + delta));
  item.reviews += 1;
  item.updatedAt = new Date().toISOString();
  progress[id] = item;
  saveProgress();
}

function reviewActiveWord(review) {
  const word = activeWord();
  if (!word || reviewClickLocked) return;
  reviewClickLocked = true;
  const delta = { again: -1, hard: 1, known: 2 }[review];
  setWordProgress(word.id, delta);
  cardIndex = Math.min(sessionWords.length - 1, cardIndex + 1);
  updateStats();
  renderCard();
  window.setTimeout(() => {
    reviewClickLocked = false;
  }, 220);
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

function normalize(text) {
  return String(text || "").toLowerCase().trim();
}

function displayBankName(bank) {
  return bankDisplay[bank.id]?.name || bank.name;
}

function displayBankDescription(bank) {
  return bankDisplay[bank.id]?.description || bank.description;
}

function isVerb(word) {
  return word?.pos === "动";
}

function arabicUyghurWithVerbMarker(word) {
  const text = String(word?.ug || "").trim();
  if (!text || !isVerb(word) || text.endsWith("ـ")) return text;
  return `${text}ـ`;
}

const latinMap = {
  "ا": "a",
  "ە": "e",
  "ې": "é",
  "ى": "i",
  "ي": "y",
  "ۇ": "u",
  "ۈ": "ü",
  "و": "o",
  "ۆ": "ö",
  "ۋ": "w",
  "ب": "b",
  "پ": "p",
  "ت": "t",
  "ج": "j",
  "چ": "ch",
  "خ": "x",
  "د": "d",
  "ر": "r",
  "ز": "z",
  "ژ": "zh",
  "س": "s",
  "ش": "sh",
  "غ": "gh",
  "ف": "f",
  "ق": "q",
  "ك": "k",
  "گ": "g",
  "ڭ": "ng",
  "ل": "l",
  "م": "m",
  "ن": "n",
  "ھ": "h",
};

function toLatinUyghur(text) {
  let hasLettersInToken = false;
  let result = "";
  for (const char of String(text || "")) {
    if (char === "ئ") {
      result += hasLettersInToken ? "'" : "";
      continue;
    }
    if (char === "ـ") {
      result += "-";
      continue;
    }
    if (latinMap[char]) {
      result += latinMap[char];
      hasLettersInToken = true;
      continue;
    }
    result += char;
    if (/[\s,，،؛;:.!?؟()[\]{}"“”'‘’]/.test(char)) hasLettersInToken = false;
  }
  return result;
}

function displayUyghur(word) {
  const marked = arabicUyghurWithVerbMarker(word);
  return latinDisplay ? toLatinUyghur(marked) : marked;
}

function syncLatinToggle() {
  if (!latinToggle) return;
  latinToggle.classList.toggle("active", latinDisplay);
  latinToggle.setAttribute("aria-pressed", String(latinDisplay));
  latinToggle.textContent = latinDisplay ? "Uyghur" : "Latin";
  latinToggle.title = latinDisplay ? "Show traditional Uyghur script" : "Show Latin Uyghur";
}

function normalizePayload(rawPayload) {
  const normalized = {
    ...rawPayload,
    banks: (rawPayload?.banks || []).map((bank) => {
      if (!Array.isArray(bank.rows) || !Array.isArray(bank.columns)) return bank;
      const words = bank.rows.map((row, rowIndex) => {
        const word = {};
        bank.columns.forEach((column, columnIndex) => {
          word[column] = row[columnIndex] ?? "";
        });
        if (!word.id) word.id = `${bank.id}-${rowIndex + 1}`;
        return word;
      });
      const levels =
        bank.levels ||
        words.reduce((summary, word) => {
          const level = word.level || "未分级";
          summary[level] = (summary[level] || 0) + 1;
          return summary;
        }, {});
      return { ...bank, levels, words };
    }),
  };
  return normalized;
}

function selectedBank() {
  return payload.banks.find((bank) => bank.id === bankSelect.value) || payload.banks[0];
}

function renderBankOptions() {
  bankSelect.innerHTML = payload.banks
    .map((bank) => `<option value="${escapeHtml(bank.id)}">${escapeHtml(displayBankName(bank))}</option>`)
    .join("");
  currentBank = selectedBank();
}

function renderLevelOptions() {
  const ordered = Object.keys(currentBank.levels).sort((a, b) => {
    return (levelRank[a] || 5) - (levelRank[b] || 5);
  });
  selectedLevels = new Set(ordered.filter((level) => level !== "未分级"));
  levelList.innerHTML = ordered
    .map(
      (level) => `
        <label class="level-item">
          <span><input type="checkbox" value="${escapeHtml(level)}" ${selectedLevels.has(level) ? "checked" : ""}> ${escapeHtml(level)}</span>
          <span>${currentBank.levels[level]}</span>
        </label>
      `
    )
    .join("");
}

function applyFilters() {
  const query = normalize(searchInput.value);
  filteredWords = currentBank.words.filter((word) => {
    if (!selectedLevels.has(word.level)) return false;
    if (onlyDueInput.checked && getWordProgress(word.id).score >= 4) return false;
    if (!query) return true;
    return [word.zh, word.ug, toLatinUyghur(word.ug), word.pos, word.valency, word.level].some((value) =>
      normalize(value).includes(query)
    );
  });
  sessionWords = shuffleInput.checked ? shuffle(filteredWords) : [...filteredWords];
  cardIndex = Math.min(cardIndex, Math.max(0, sessionWords.length - 1));
  updateStats();
  renderMode();
}

function updateStats() {
  const known = currentBank.words.filter((word) => getWordProgress(word.id).score >= 4).length;
  const filteredSummary = summarizeWords(filteredWords);
  totalCount.textContent = filteredWords.length;
  knownCount.textContent = filteredSummary.known;
  fuzzyCount.textContent = filteredSummary.fuzzy;
  progressRate.textContent = `${Math.round((known / currentBank.words.length) * 100)}%`;
  const levels = [...selectedLevels].join(" ");
  const bankName = displayBankName(currentBank);
  activeTitle.textContent = levels ? `${bankName} · ${levels}` : bankName;
  bankDescription.textContent = displayBankDescription(currentBank);
  renderMemoryCharts(filteredSummary, summarizeByLevel(filteredWords));
}

function summarizeWords(words) {
  const summary = { total: words.length, new: 0, fuzzy: 0, known: 0 };
  for (const word of words) {
    summary[memoryState(word)] += 1;
  }
  return summary;
}

function summarizeByLevel(words) {
  const levels = {};
  for (const word of words) {
    if (!levels[word.level]) levels[word.level] = { total: 0, new: 0, fuzzy: 0, known: 0 };
    levels[word.level].total += 1;
    levels[word.level][memoryState(word)] += 1;
  }
  return levels;
}

function percent(value, total) {
  return total ? Math.round((value / total) * 100) : 0;
}

function renderMemoryCharts(summary, levels) {
  const knownPct = percent(summary.known, summary.total);
  const fuzzyPct = percent(summary.fuzzy, summary.total);
  const newPct = Math.max(0, 100 - knownPct - fuzzyPct);
  const knownDeg = (summary.known / Math.max(1, summary.total)) * 360;
  const fuzzyDeg = (summary.fuzzy / Math.max(1, summary.total)) * 360;
  memoryDonut.style.background = [
    `conic-gradient(`,
    `var(--green) 0deg ${knownDeg}deg,`,
    `var(--gold) ${knownDeg}deg ${knownDeg + fuzzyDeg}deg,`,
    `#dfe6df ${knownDeg + fuzzyDeg}deg 360deg`,
    `)`,
  ].join("");
  memoryDonut.dataset.center = `${knownPct}%`;
  memoryLegend.innerHTML = [
    ["known", "Known", summary.known, knownPct],
    ["fuzzy", "Fuzzy", summary.fuzzy, fuzzyPct],
    ["new", "New / Again", summary.new, newPct],
  ]
    .map(
      ([key, label, count, pct]) => `
        <div class="legend-row">
          <span class="legend-dot dot-${key}"></span>
          <span>${label}<small> ${pct}%</small></span>
          <strong>${count}</strong>
        </div>
      `
    )
    .join("");

  const order = Object.keys(levels).sort((a, b) => {
    return (levelRank[a] || 5) - (levelRank[b] || 5);
  });
  levelChart.innerHTML = order
    .map((level) => {
      const item = levels[level];
      const knownWidth = percent(item.known, item.total);
      const fuzzyWidth = percent(item.fuzzy, item.total);
      const newWidth = Math.max(0, 100 - knownWidth - fuzzyWidth);
      return `
        <div class="level-bar-row">
          <span class="level-name">${escapeHtml(level)}</span>
          <div class="stacked-bar" title="Known ${item.known}, fuzzy ${item.fuzzy}, new/again ${item.new}">
            <span class="bar-segment bar-known" style="width:${knownWidth}%"></span>
            <span class="bar-segment bar-fuzzy" style="width:${fuzzyWidth}%"></span>
            <span class="bar-segment bar-new" style="width:${newWidth}%"></span>
          </div>
          <span class="level-total">${item.known}/${item.total}</span>
        </div>
      `;
    })
    .join("");
}

function activeWord() {
  return sessionWords[cardIndex] || null;
}

function renderCard() {
  resetCardDrag();
  const word = activeWord();
  if (!word) {
    cardLevel.textContent = "";
    cardPos.textContent = "";
    cardUg.textContent = "No words";
    cardZh.textContent = "";
    cardValency.textContent = "";
    cardMeaning.hidden = true;
    cardPosition.textContent = "0 / 0";
    return;
  }
  cardLevel.textContent = word.level;
  cardPos.textContent = word.pos;
  cardUg.textContent = displayUyghur(word);
  cardUg.classList.toggle("latin-text", latinDisplay);
  cardZh.textContent = word.zh;
  cardValency.textContent = word.valency || "";
  cardMeaning.hidden = true;
  cardPosition.textContent = `${cardIndex + 1} / ${sessionWords.length}`;
}

function resetCardDrag() {
  if (!wordCard) return;
  dragStart = null;
  dragCurrent = null;
  draggingCard = false;
  wordCard.classList.remove("dragging", "swipe-preview-left", "swipe-preview-right", "swipe-preview-down");
  wordCard.style.transform = "";
}

function updateSwipePreview(deltaX, deltaY) {
  wordCard.classList.toggle("swipe-preview-right", deltaX > 70 && Math.abs(deltaX) > Math.abs(deltaY));
  wordCard.classList.toggle("swipe-preview-left", deltaX < -70 && Math.abs(deltaX) > Math.abs(deltaY));
  wordCard.classList.toggle("swipe-preview-down", deltaY > 80 && Math.abs(deltaY) > Math.abs(deltaX));
}

function finishCardDrag() {
  if (!dragStart || !dragCurrent) {
    resetCardDrag();
    return;
  }
  const deltaX = dragCurrent.x - dragStart.x;
  const deltaY = dragCurrent.y - dragStart.y;
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  let review = null;
  if (absX > absY && absX > 90) review = deltaX > 0 ? "known" : "again";
  if (absY > absX && deltaY > 100) review = "hard";
  if (review) {
    const exitX = review === "known" ? 420 : review === "again" ? -420 : deltaX;
    const exitY = review === "hard" ? 420 : deltaY;
    const exitRotation = review === "hard" ? 0 : exitX / 20;
    wordCard.classList.remove("dragging");
    wordCard.style.transform = `translate(${exitX}px, ${exitY}px) rotate(${exitRotation}deg)`;
    window.setTimeout(() => reviewActiveWord(review), 120);
    return;
  }
  resetCardDrag();
}

function renderTable() {
  const rows = filteredWords.slice(0, 800);
  tableBody.innerHTML = rows
    .map((word) => {
      const state = memoryState(word);
      const label = memoryLabels[state];
      return `
        <tr>
          <td data-label="Uyghur" class="${latinDisplay ? "latin-text" : ""}">${escapeHtml(displayUyghur(word))}</td>
          <td data-label="Chinese">${escapeHtml(word.zh)}</td>
          <td data-label="Part of Speech">${escapeHtml(word.pos)}</td>
          <td data-label="Valency">${escapeHtml(word.valency || "")}</td>
          <td data-label="Level">${escapeHtml(word.level)}</td>
          <td data-label="Status" class="status-${state}">${label}</td>
        </tr>
      `;
    })
    .join("");
}

function makeChoices(word) {
  const pool = currentBank.words.filter((item) => item.id !== word.id && item.level === word.level);
  const options = shuffle(pool).slice(0, 3).map((item) => item.zh);
  return shuffle([word.zh, ...options]);
}

function renderQuiz() {
  if (!filteredWords.length) {
    quizWord.textContent = "No words";
    quizMeta.textContent = "";
    choices.innerHTML = "";
    quizResult.textContent = "";
    quizAnswered = false;
    return;
  }
  quizCurrent = shuffle(filteredWords)[0];
  quizAnswered = false;
  quizWord.textContent = displayUyghur(quizCurrent);
  quizWord.classList.toggle("latin-text", latinDisplay);
  quizMeta.textContent = `${quizCurrent.level} · ${quizCurrent.pos}`;
  quizResult.textContent = "";
  choices.innerHTML = makeChoices(quizCurrent)
    .map((choice) => `<button type="button">${escapeHtml(choice)}</button>`)
    .join("");
}

function renderMode() {
  views.forEach((view) => view.classList.toggle("active", view.dataset.view === mode));
  if (mode === "flashcard") renderCard();
  if (mode === "quiz") renderQuiz();
  if (mode === "list") renderTable();
}

async function init() {
  if (window.WORD_BANKS) {
    payload = window.WORD_BANKS;
  } else {
    try {
    payload = await fetch("./data/wordbanks.json").then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    });
    } catch (error) {
    document.body.insertAdjacentHTML(
      "afterbegin",
      `<div style="padding:12px 16px;background:#fff4df;color:#5d3b00;font-weight:800;border-bottom:1px solid #e8c77d">
        Word bank data failed to load. Check that data/wordbanks.js or data/wordbanks.json is in this project folder.
      </div>`
    );
    throw error;
    }
  }
  payload = normalizePayload(payload);
  renderBankOptions();
  renderLevelOptions();
  syncLatinToggle();
  applyFilters();
}

bankSelect.addEventListener("change", () => {
  currentBank = selectedBank();
  renderLevelOptions();
  applyFilters();
});

levelList.addEventListener("change", () => {
  selectedLevels = new Set([...levelList.querySelectorAll("input:checked")].map((input) => input.value));
  applyFilters();
});

searchInput.addEventListener("input", applyFilters);
onlyDueInput.addEventListener("change", applyFilters);
shuffleInput.addEventListener("change", applyFilters);

modeTabs.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-mode]");
  if (!button) return;
  if (mode === button.dataset.mode) return;
  mode = button.dataset.mode;
  modeTabs.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
  renderMode();
});

revealButton.addEventListener("click", () => {
  cardMeaning.hidden = false;
});

prevCard.addEventListener("click", () => {
  cardIndex = Math.max(0, cardIndex - 1);
  renderCard();
});

nextCard.addEventListener("click", () => {
  cardIndex = Math.min(sessionWords.length - 1, cardIndex + 1);
  renderCard();
});

reviewActions.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-review]");
  if (!button) return;
  reviewActiveWord(button.dataset.review);
});

wordCard.addEventListener("pointerdown", (event) => {
  if (event.target.closest("button")) return;
  if (!activeWord() || reviewClickLocked) return;
  dragStart = { x: event.clientX, y: event.clientY };
  dragCurrent = dragStart;
  draggingCard = true;
  wordCard.classList.add("dragging");
  wordCard.setPointerCapture(event.pointerId);
});

wordCard.addEventListener("pointermove", (event) => {
  if (!draggingCard || !dragStart) return;
  dragCurrent = { x: event.clientX, y: event.clientY };
  const deltaX = dragCurrent.x - dragStart.x;
  const deltaY = dragCurrent.y - dragStart.y;
  const rotation = Math.max(-12, Math.min(12, deltaX / 18));
  wordCard.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`;
  updateSwipePreview(deltaX, deltaY);
});

wordCard.addEventListener("pointerup", finishCardDrag);
wordCard.addEventListener("pointercancel", resetCardDrag);

resetSession.addEventListener("click", applyFilters);

clearProgress.addEventListener("click", () => {
  for (const key of Object.keys(progress)) delete progress[key];
  saveProgress();
  applyFilters();
});

latinToggle?.addEventListener("click", () => {
  latinDisplay = !latinDisplay;
  localStorage.setItem("uyghur-vocab-latin-display", latinDisplay ? "1" : "0");
  syncLatinToggle();
  renderMode();
});

choices.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || !quizCurrent || quizAnswered) return;
  quizAnswered = true;
  const correct = button.textContent === quizCurrent.zh;
  button.classList.add(correct ? "correct" : "wrong");
  choices.querySelectorAll("button").forEach((item) => {
    item.disabled = true;
  });
  setWordProgress(quizCurrent.id, correct ? 1 : -1);
  quizResult.textContent = correct
    ? `Correct: ${quizCurrent.zh}`
    : `Answer: ${quizCurrent.zh}`;
  updateStats();
});

nextQuiz.addEventListener("click", renderQuiz);

init();

let lastPostedEmbedHeight = 0;
function postEmbedHeight() {
  if (window.parent === window) return;
  const height = Math.max(
    document.documentElement.scrollHeight,
    document.body?.scrollHeight || 0,
    document.documentElement.offsetHeight,
  );
  if (Math.abs(height - lastPostedEmbedHeight) < 2) return;
  lastPostedEmbedHeight = height;
  window.parent.postMessage({ type: "uyghur-vocab-height", height }, "*");
}

window.addEventListener("load", postEmbedHeight);
window.addEventListener("resize", postEmbedHeight);
window.addEventListener("message", (event) => {
  if (event.data?.type === "request-uyghur-vocab-height") postEmbedHeight();
});

new MutationObserver(() => window.requestAnimationFrame(postEmbedHeight)).observe(document.body, {
  attributes: true,
  childList: true,
  subtree: true,
});

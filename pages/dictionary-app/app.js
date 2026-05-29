const state = {
  entries: [],
  filtered: [],
  mode: "all",
  page: 1,
  pageSize: 10,
  selectedId: null,
  query: "",
};

const els = {
  input: document.querySelector("#searchInput"),
  latinInput: document.querySelector("#latinInput"),
  arabicInput: document.querySelector("#arabicInput"),
  results: document.querySelector("#results"),
  detail: document.querySelector("#detail"),
  count: document.querySelector("#entryCount"),
  pagination: document.querySelector("#pagination"),
  modeButtons: [...document.querySelectorAll(".mode-button")],
};

const LATIN_TO_ARABIC = {
  "ʿ": "ع",
  "ʾ": "ء",
  b: "ب",
  p: "پ",
  t: "ت",
  d: "د",
  "ḍ": "ض",
  "ḏ": "ذ",
  r: "ر",
  z: "ز",
  "ẓ": "ظ",
  "ż": "ز",
  "ž": "ژ",
  s: "س",
  "ṣ": "ص",
  "š": "ش",
  c: "ج",
  "ǰ": "ج",
  j: "ج",
  "č": "چ",
  ç: "چ",
  f: "ف",
  q: "ق",
  k: "ک",
  g: "گ",
  "ġ": "غ",
  "ğ": "غ",
  n: "ن",
  m: "م",
  l: "ل",
  h: "ه",
  "ḥ": "ح",
  "ẖ": "خ",
  x: "خ",
  v: "و",
  w: "و",
  y: "ی",
  a: "ا",
  "ā": "ا",
  "ī": "ی",
  "ū": "و",
  "ä": "ە",
  e: "ە",
  i: "ی",
  "ï": "ی",
  ı: "ی",
  o: "و",
  "ö": "و",
  u: "و",
  "ü": "و",
};

const SHORT_VOWELS = new Set(["a", "ä", "e", "i", "ï", "ı", "o", "ö", "u", "ü"]);
const INITIAL_VOWELS = new Set([...SHORT_VOWELS, "ā", "ī", "ū"]);

const ARABIC_EXCEPTIONS = {
  كتاب: "kitāb",
  کتاب: "kitāb",
  دنيا: "dunyā",
  دنیا: "dunyā",
  اياغ: "ayaġ",
  ایاغ: "ayaġ",
};

const LATIN_ARABIC_OVERRIDES = {
  kitāb: "کتاب",
  dunyā: "دنیا",
  "muʿallim": "معلم",
  "ʿaǰab": "عجب",
  "ʿahd": "عهد",
};

const ARABIC_TO_LATIN = {
  ا: "a",
  آ: "a",
  ب: "b",
  پ: "p",
  ت: "t",
  ث: "s",
  ج: "ǰ",
  چ: "č",
  ح: "ḥ",
  خ: "ẖ",
  د: "d",
  ذ: "ḏ",
  ر: "r",
  ز: "z",
  ژ: "ž",
  س: "s",
  ش: "š",
  ص: "ṣ",
  ض: "ḍ",
  ط: "ṭ",
  ظ: "ẓ",
  ع: "ʿ",
  غ: "ġ",
  ف: "f",
  ق: "q",
  ك: "k",
  ک: "k",
  گ: "g",
  ڭ: "ñ",
  ل: "l",
  م: "m",
  ن: "n",
  و: "u",
  ه: "h",
  ھ: "h",
  ە: "ä",
  ة: "a",
  ي: "y",
  ی: "y",
  ى: "y",
};

const ABBREVIATIONS = {
  ABU: "Abusqa (Guzeldir 2002)",
  AH: "Kitab al-Idrak (Caferoglu 1931, Ozyetgin 2001)",
  AHkb: "quotations from the Kitab-i Baylik",
  BM: "Kitab bulgat al-mustaq (Zajaczkowski 1954, 1958)",
  BV: "Kitab baytarat al-vadih (Istanbul MS, Nissman 1969)",
  BVp: "Paris MS (Ozgur 1994)",
  "Calcutta d.": "Fadl allah Khan (1825)",
  CC: "Codex Cumanicus (Gronbech 1942, Drimba 2000, Argunsah & Guner 2015)",
  CCa: "Codex Cumanicus, German section",
  CCb: "Codex Cumanicus, Italian section",
  CCp: "Codex Cumanicus, items listed as Persian",
  CL: "Clauson (1972)",
  DK: "Dankoff & Kelly (1982)",
  DM: "ad-Durra al-mudi'a (Zajaczkowski 1965a-b, 1968, 1969; Toparli 2003)",
  DQ: "Kitab-i Dada Qorqud (Tezcan & Boeschoten 2001)",
  DQg: "Kitab-i Dada Qorqud, MS Gonbad",
  DQy: "Topkapi Sarayi Oguznamesi",
  DS: "Derleme Sozlugu",
  FK: "Harezm Turkcesi fal kitabi",
  FAZa: "text in Fazylov (1989)",
  FAZb: "text in Fazylov (1990)",
  FZ: "Turkic materials from Farhang-i Zafan-guya",
  GUL: "Gulistan bi-t-Turki",
  HAU: "Wilkens (2021)",
  HK: "Halasi Kun (1947)",
  IM: "Ibn al-Muhanna, Kitab Hilyat al-insan wa-Halbat al-lisan",
  IMa: "Ibn al-Muhanna, from Kilisli Rifat and Karagozlu",
  IMb: "Ibn al-Muhanna, from Melioranski",
  IN: "Kitab fi ilm an-nussab",
  IrM: "Irsad al-muluk va s-salatin",
  JET: "Jarring (1964)",
  KA: "Kitab al-Af'al",
  KBK: "Kasikbas Kitabi",
  KD: "Rasulid Hexaglot",
  KNagy: "Kincses-Nagy (2018)",
  KT: "Kitabi majmua-i tarjuman",
  LisAr: "Ibn Manzur, Lisan al-Arab",
  LN: "Hojandi, Latafatnama",
  MA: "Muqaddimat al-adab",
  MAv: "Muqaddimat al-adab, verbs",
  MAn: "Muqaddimat al-adab, non-verbs",
  MG: "Margin Grammar",
  MiN: "Mi'rajnama",
  MK: "Mahmud Kasgari, Divan lugati t-Turk",
  MM: "Mu'in al-Murid",
  MN: "Muhabbatnama",
  MO: "Manzum Oguzname",
  MuG: "Munyat al-guzat",
  NF: "Nahj al-Faradis",
  ON: "Oguzname",
  OTW: "Erdal (1991)",
  PdC: "Pavet de Courteille (1870)",
  QA: "Qisas al-Anbiya'",
  QAt: "Qisas al-Anbiya', Tehran MS",
  QAc: "Qisas al-Anbiya', MS Academy St. Petersburg",
  QAb: "Qisas al-Anbiya', MS National Library St. Petersburg",
  QAba: "Qisas al-Anbiya', Baku MS",
  QB: "Qutadgu Bilig",
  QK: "Qawanin al-kulliyya",
  QT1: "Rylands interlinear translation of the Quran",
  QT2: "Anonymous tafsir",
  QT3: "Interlinear translation, Turk ve Islam Eserleri Muzesi",
  QT4: "Interlinear translation, Suleymaniye Kutuphanesi",
  QT5: "Interlinear translation, MS Mashhad",
  QT6: "Interlinear translation, MS Tashkent",
  QY: "Qissa-i Yusuf",
  Radl: "Radloff (1960)",
  "Radl.": "Radloff (1960)",
  RAS: "Rasanen (1969)",
  "RÄS": "Rasanen (1969)",
  RH: "Kitab fi riyadat al-hayl",
  RR: "Rizvan Sah ile Ruh-Afza hikayesi",
  SAN: "Sanglax",
  SEV: "Sevortjan (1974-)",
  SQ: "Siraj al-Qulub",
  ST: "Steingass (1947)",
  TMEN: "Doerfer (1963-1975)",
  TN: "Tansuqnama",
  TTS: "Tarama Sozlugu",
  TZ: "at-Tuhfa az-zakiyya",
  UTIL: "Ma'rufov (red., 1981)",
  "ŬTIL": "Ma'rufov (red., 1981)",
  UW: "Uigurisches Worterbuch",
  WE: "Wehr (1971)",
  WOT: "Rona-Tas & Berta (2011)",
  XS: "Husrav u Sirin",
  "XŠ": "Husrav u Sirin",
  YL: "yarliq documents",
  ZE: "Zenker (1866-1876)",
  "abl.": "ablative",
  "acc.": "accusative",
  "adv.": "adverb",
  "alt.": "Altay Turkic",
  "aor.": "aorist",
  "ar.": "Arabic",
  "aram.": "Aramaic",
  "arm.": "Armenian",
  "aux.": "auxiliary",
  "az.": "Azerbaijani",
  "bar.": "Baraba Tatar",
  "bsk.": "Bashkir",
  "bšk.": "Bashkir",
  "chin.": "Chinese",
  "comp.": "comparative",
  "cond.": "conditional",
  "conj.": "conjunction",
  "dat.": "dative",
  "descr.": "descriptive",
  "dial.": "dialect",
  "dimin.": "diminutive",
  "dir.": "directive",
  "equ.": "equative",
  "esp.": "especially",
  "excl.": "exclamation",
  "fem.": "feminine",
  "fig.": "figurative",
  "g.": "general",
  "gen.": "genitive",
  "germ.": "German",
  "gk.": "Greek",
  Gr: "grammar",
  "hap.": "hapax legomenon",
  "hung.": "Hungarian",
  "imp.": "imperative",
  "inf.": "infinitive",
  Ioc: "in our own country",
  "iran.": "Iranian",
  "it.": "Italian",
  "itr.": "intransitive",
  "kar.": "Karaim",
  "khak.": "Khakas",
  "khwar.": "Khwarezmian (Iranic)",
  "krg.": "Kirghiz",
  "kzk.": "Kazakh",
  "l.": "line",
  "lat.": "Latin",
  "lg.": "language",
  "lit.": "Lithuanian",
  "loc.": "locative",
  "mgk.": "Middle Greek",
  "mistr.": "mistranslation",
  "misvoc.": "misvocalized",
  "mmong.": "Middle Mongolian",
  "mpers.": "Middle Persian",
  Mrg: "margin",
  "nog.": "Noghay",
  "onom.": "onomatopoeic",
  "osm.": "Ottoman / Old Anatolian Turkish",
  "ot.": "Old Turkic",
  "pers.": "Persian",
  "pl.": "plural",
  "poss.": "possessive",
  "postp.": "postposition",
  "prtcp.": "participle",
  qip: "Kipchak",
  "russ.": "Russian",
  "skr.": "Sanskrit",
  "sogd.": "Sogdian",
  "syn.": "synonym",
  "taj.": "Tajik",
  "tat.": "Volga Tatar",
  "temp.": "temporal",
  "tib.": "Tibetan",
  "tk.": "Turkic",
  tkm: "Turkmen",
  "tkm.": "modern Turkmen",
  "tokh.": "Tokharian",
  toqs: "reference in AH to an unknown tribe called Toqsuba",
  "tr.": "transitive",
  "tt.": "Turkish",
  turk: "in Turkestan",
  "ukr.": "Ukrainian",
  "uyg.": "modern Uighur",
  "uzb.": "Uzbek",
  "yak.": "Yakut",
};

function normalize(text) {
  return text
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function latinToArabic(text) {
  const trimmed = text.trim();
  if (LATIN_ARABIC_OVERRIDES[trimmed]) return LATIN_ARABIC_OVERRIDES[trimmed];

  const clean = text
    .toLocaleLowerCase()
    .normalize("NFC")
    .replace(/[0-9=*?.,;:!|\/\[\](){}<>'’‘"“”-]/g, "");
  let output = "";
  let atWordStart = true;
  for (let i = 0; i < clean.length; i += 1) {
    const pair = clean.slice(i, i + 2);
    if (pair === "ng") {
      output += "نگ";
      i += 1;
      atWordStart = false;
      continue;
    }
    if (pair === "ā" || pair === "ī" || pair === "ū") {
      output += LATIN_TO_ARABIC[pair];
      i += 1;
      atWordStart = false;
      continue;
    }
    const char = clean[i];
    if (/\s/u.test(char)) {
      output += char;
      atWordStart = true;
    } else if (atWordStart && INITIAL_VOWELS.has(char)) {
      output += "ا";
      atWordStart = false;
    } else if (char === "ä" || char === "e") {
      output += "ە";
      atWordStart = false;
    } else if (char === "a") {
      output += "ا";
      atWordStart = false;
    } else if (SHORT_VOWELS.has(char)) {
      atWordStart = false;
    } else {
      output += LATIN_TO_ARABIC[char] ?? char;
      atWordStart = false;
    }
  }
  return output
    .replace(/([بتدذرزژسشصضطظعغفقکگلمنهحخ])\1+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeArabic(text) {
  return text
    .normalize("NFC")
    .replace(/[ًٌٍَُِّْٰـ]/g, "")
    .replace(/[كيى]/g, (char) => ({ ك: "ک", ي: "ی", ى: "ی" })[char]);
}

function arabicToLatin(text) {
  const normalized = normalizeArabic(text.trim());
  if (ARABIC_EXCEPTIONS[text.trim()] || ARABIC_EXCEPTIONS[normalized]) {
    return ARABIC_EXCEPTIONS[text.trim()] || ARABIC_EXCEPTIONS[normalized];
  }

  const exact = state.entries.find((entry) => normalizeArabic(entry.arabic || "") === normalized);
  if (exact) return exact.headword;

  let output = "";
  const chars = [...text.normalize("NFC")];
  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index];
    const previous = chars[index - 1] || "";
    if (char === "ا" || char === "آ") {
      output += index === 0 || previous === "ی" || previous === "ي" ? "a" : "ā";
    } else if (char === "و") {
      output += "u";
    } else if (char === "ی" || char === "ي" || char === "ى") {
      output += "y";
    } else {
      output += ARABIC_TO_LATIN[char] ?? char;
    }
  }
  return output.replace(/\s+/g, " ").trim();
}

function getArabicSpelling(entry) {
  return entry.arabic || latinToArabic(entry.headword);
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return map[char];
  });
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getAbbreviationNotes(text) {
  return Object.entries(ABBREVIATIONS)
    .filter(([abbr]) => {
      const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(abbr)}(?=$|[^\\p{L}\\p{N}])`, "u");
      return pattern.test(text);
    })
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 18);
}

function renderAbbreviationNotes(text) {
  const notes = getAbbreviationNotes(text);
  if (!notes.length) return "";
  return `<section class="abbr-notes">
    <h3>缩略语说明</h3>
    <dl>
      ${notes.map(([abbr, meaning]) => `<div><dt>${escapeHtml(abbr)}</dt><dd>${escapeHtml(meaning)}</dd></div>`).join("")}
    </dl>
  </section>`;
}

function makeSnippet(text, query) {
  if (!query) return text.slice(0, 220);
  const haystack = normalize(text);
  const needle = normalize(query);
  const index = haystack.indexOf(needle);
  if (index < 0) return text.slice(0, 220);
  const start = Math.max(0, index - 70);
  const end = Math.min(text.length, index + needle.length + 150);
  return `${start > 0 ? "..." : ""}${text.slice(start, end)}${end < text.length ? "..." : ""}`;
}

function rankEntry(entry, query) {
  if (!query) return 1;
  const q = normalize(query);
  if (entry.sortKey === q) return 100;
  if (entry.arabic && entry.arabic === query.trim()) return 100;
  if (entry.sortKey.startsWith(q)) return 80;
  if (entry.arabic && entry.arabic.startsWith(query.trim())) return 80;
  if (entry.sortKey.includes(q)) return 60;
  if (entry.arabic && entry.arabic.includes(query.trim())) return 60;
  if (entry.searchText.includes(q)) return 20;
  return 0;
}

function filterEntries() {
  const q = state.query.trim();
  const nq = normalize(q);
  const source = q
    ? state.entries
        .map((entry) => ({
          entry,
          rank:
            state.mode === "headword"
              ? entry.sortKey.includes(nq) || (entry.arabic && entry.arabic.includes(q))
                ? rankEntry(entry, q)
                : 0
              : rankEntry(entry, q),
        }))
        .filter((item) => item.rank > 0)
        .sort((a, b) => b.rank - a.rank || a.entry.sortKey.localeCompare(b.entry.sortKey))
        .map((item) => item.entry)
    : state.entries.slice(0, 80);

  state.filtered = source;
  const pageCount = getPageCount();
  if (state.page > pageCount) {
    state.page = pageCount;
  }

  const pageEntries = getPageEntries();
  if (!pageEntries.some((entry) => entry.id === state.selectedId)) {
    state.selectedId = pageEntries[0]?.id ?? null;
  }
}

function getPageCount() {
  return Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
}

function getPageEntries() {
  const start = (state.page - 1) * state.pageSize;
  return state.filtered.slice(start, start + state.pageSize);
}

function getVisiblePages(page, pageCount) {
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  return [...pages].filter((item) => item >= 1 && item <= pageCount).sort((a, b) => a - b);
}

function renderResults() {
  els.count.textContent = state.query ? `${state.filtered.length}` : `${state.entries.length}`;
  const offset = (state.page - 1) * state.pageSize;
  els.results.innerHTML = getPageEntries()
    .map((entry, index) => {
      const selected = entry.id === state.selectedId ? " selected" : "";
      return `<li>
        <button class="result-button${selected}" type="button" data-id="${entry.id}">
          <span class="result-index">${offset + index + 1}</span>
          <span class="result-head">
            <span class="headword">${escapeHtml(entry.headword)}<span class="result-arabic-line"><span class="arabic-spelling" dir="rtl">${escapeHtml(getArabicSpelling(entry))}</span><span class="arabic-note">Arabic script reference only</span></span></span>
            <span class="page">p.${entry.page}</span>
          </span>
          <span class="snippet">${escapeHtml(makeSnippet(entry.text, state.query))}</span>
        </button>
      </li>`;
    })
    .join("");
}

function renderPagination() {
  const pageCount = getPageCount();
  if (!els.pagination) return;
  if (pageCount <= 1) {
    els.pagination.innerHTML = "";
    return;
  }

  const pages = getVisiblePages(state.page, pageCount);
  let previous = 0;
  const pageButtons = pages
    .map((page) => {
      const gap = previous && page - previous > 1 ? `<span class="page-gap">...</span>` : "";
      previous = page;
      const active = page === state.page ? " active" : "";
      return `${gap}<button class="page-button${active}" type="button" data-page="${page}" aria-label="Page ${page}">${page}</button>`;
    })
    .join("");

  els.pagination.innerHTML = `<button class="page-button" type="button" data-page="${state.page - 1}" ${state.page === 1 ? "disabled" : ""}>Previous</button>
    ${pageButtons}
    <button class="page-button" type="button" data-page="${state.page + 1}" ${state.page === pageCount ? "disabled" : ""}>Next</button>`;
}

function renderDetail() {
  const entry = state.entries.find((item) => item.id === state.selectedId);
  if (!entry) {
    els.detail.innerHTML = `<div class="empty-state"><h2>No results</h2><p>Try another headword, English meaning, or spelling without diacritics.</p></div>`;
    return;
  }

  els.detail.innerHTML = `<article class="entry-summary">
    <header class="entry-title-row">
      <span class="detail-index">${entry.id}</span>
      <div class="title-forms">
        <div class="title-main-line">
          <h2>${escapeHtml(entry.headword)}</h2>
          <span class="detail-arabic" dir="rtl">${escapeHtml(getArabicSpelling(entry))}</span>
        </div>
        <div class="detail-meta-line">
          <span class="arabic-note">Arabic script reference only</span>
          <span class="page">p.${entry.page}</span>
        </div>
      </div>
    </header>
    <p class="entry-text">${escapeHtml(entry.text)}</p>
    ${renderAbbreviationNotes(entry.text)}
  </article>`;
}

function update() {
  filterEntries();
  renderResults();
  renderPagination();
  renderDetail();
}

els.input.addEventListener("input", (event) => {
  state.query = event.target.value;
  state.page = 1;
  update();
});

let converterLock = false;

if (els.latinInput && els.arabicInput) {
  els.latinInput.addEventListener("input", () => {
    if (converterLock) return;
    converterLock = true;
    els.arabicInput.value = latinToArabic(els.latinInput.value);
    converterLock = false;
  });

  els.arabicInput.addEventListener("input", () => {
    if (converterLock) return;
    converterLock = true;
    els.latinInput.value = arabicToLatin(els.arabicInput.value);
    converterLock = false;
  });
}

els.results.addEventListener("click", (event) => {
  const button = event.target.closest(".result-button");
  if (!button) return;
  state.selectedId = Number(button.dataset.id);
  renderResults();
  renderPagination();
  renderDetail();
});

if (els.pagination) {
  els.pagination.addEventListener("click", (event) => {
    const button = event.target.closest(".page-button");
    if (!button || button.disabled) return;
    const page = Number(button.dataset.page);
    if (!Number.isFinite(page)) return;
    state.page = Math.min(Math.max(page, 1), getPageCount());
    const pageEntries = getPageEntries();
    state.selectedId = pageEntries[0]?.id ?? null;
    renderResults();
    renderPagination();
    renderDetail();
  });
}

els.modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    state.page = 1;
    els.modeButtons.forEach((item) => item.classList.toggle("active", item === button));
    update();
    els.input.focus();
  });
});

async function boot() {
  if (Array.isArray(window.DICTIONARY_ENTRIES)) {
    state.entries = window.DICTIONARY_ENTRIES;
  } else {
    const response = await fetch("data/entries.json");
    state.entries = await response.json();
  }
  update();
}

boot().catch((error) => {
  els.detail.innerHTML = `<div class="empty-state"><h2>数据加载失败</h2><p>${escapeHtml(error.message)}</p></div>`;
});

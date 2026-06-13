(() => {
  "use strict";

  const translations = {};

  const languageMeta = {
    en: { short: "EN", labelKey: "languageEn", htmlLang: "en" },
    "zh-hans": { short: "简", labelKey: "languageZhHans", htmlLang: "zh-CN" },
    "zh-hant": { short: "繁", labelKey: "languageZhHant", htmlLang: "zh-Hant" },
    "ug-trad": { short: "ئۇ", labelKey: "languageUgTrad", htmlLang: "ug-Arab" },
    "ug-latn": { short: "ULY", labelKey: "languageUgLatn", htmlLang: "ug-Latn" },
  };

  const languageGroups = [
    { labelKey: "languageChineseGroup", languages: ["zh-hans", "zh-hant"] },
    { labelKey: "languageUyghurGroup", languages: ["ug-trad", "ug-latn"] },
  ];

  const register = (entries = {}) => {
    Object.assign(translations, entries);
  };

  window.AkviusTranslations = {
    translations,
    languageMeta,
    languageGroups,
    register,
    toTraditionalChinese: (text) => String(text ?? ""),
    uyghurArabicToLatin: (text) => String(text ?? ""),
  };
})();

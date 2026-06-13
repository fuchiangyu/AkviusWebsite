(() => {
  "use strict";

  const upperAfterSentenceBreak = (text) => {
    let shouldCapitalize = true;
    return [...String(text ?? "")]
      .map((char) => {
        if (/[a-z]/.test(char)) {
          const next = shouldCapitalize ? char.toUpperCase() : char;
          shouldCapitalize = false;
          return next;
        }

        if (/[.!?\u3002\uff01\uff1f\n\r]/.test(char)) {
          shouldCapitalize = true;
        } else if (/\S/.test(char)) {
          shouldCapitalize = false;
        }

        return char;
      })
      .join("");
  };

  const uyghurArabicToLatin = (text) => {
    const digraphs = [
      ["\u06ad", "ng"],
      ["\u0686", "ch"],
      ["\u0634", "sh"],
      ["\u063a", "gh"],
      ["\u0698", "zh"],
    ];
    const letters = {
      "\u0627": "a",
      "\u06d5": "e",
      "\u06d0": "ë",
      "\u0649": "i",
      "\u064a": "y",
      "\u0648": "o",
      "\u06c7": "u",
      "\u06c6": "ö",
      "\u06c8": "ü",
      "\u06cb": "w",
      "\u0628": "b",
      "\u067e": "p",
      "\u062a": "t",
      "\u062c": "j",
      "\u062e": "x",
      "\u062f": "d",
      "\u0631": "r",
      "\u0632": "z",
      "\u0633": "s",
      "\u0641": "f",
      "\u0642": "q",
      "\u0643": "k",
      "\u06af": "g",
      "\u0644": "l",
      "\u0645": "m",
      "\u0646": "n",
      "\u06be": "h",
      "\u0647": "h",
      "\u0621": "ʾ",
      "\u060c": ",",
    };
    const uyghurLetterPattern = /[\u0621-\u063a\u0641-\u064a\u067e\u0686\u0698\u06ad\u06af\u06be\u06c6-\u06cb\u06d0\u06d5]/;

    let output = String(text ?? "");
    digraphs.forEach(([arabic, latin]) => {
      output = output.replaceAll(arabic, latin);
    });

    return upperAfterSentenceBreak(
      [...output]
        .map((char, index, chars) => {
          if (char === "\u0626") {
            return uyghurLetterPattern.test(chars[index - 1] || "") && uyghurLetterPattern.test(chars[index + 1] || "") ? "'" : "";
          }
          return letters[char] ?? char;
        })
        .join(""),
    );
  };

  window.AkviusTranslations = window.AkviusTranslations || {};
  window.AkviusTranslations.uyghurArabicToLatin = uyghurArabicToLatin;
})();

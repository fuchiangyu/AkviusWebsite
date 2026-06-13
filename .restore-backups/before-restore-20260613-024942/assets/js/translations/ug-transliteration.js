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
      "\u06d0": "e",
      "\u0649": "i",
      "\u064a": "y",
      "\u0648": "o",
      "\u06c7": "u",
      "\u06c6": "o",
      "\u06c8": "u",
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
      "\u0621": "",
      "\u0626": "",
      "\u060c": ",",
      "\u061b": ";",
      "\u061f": "?",
    };

    let output = String(text ?? "");
    digraphs.forEach(([arabic, latin]) => {
      output = output.replaceAll(arabic, latin);
    });

    output = output.replace(/[\u064b-\u065f\u0670\u06d6-\u06ed]/g, "");

    return upperAfterSentenceBreak([...output].map((char) => letters[char] ?? char).join(""));
  };

  window.AkviusTranslations = window.AkviusTranslations || {};
  window.AkviusTranslations.uyghurArabicToLatin = uyghurArabicToLatin;
})();

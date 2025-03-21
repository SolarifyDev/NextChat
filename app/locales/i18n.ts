import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import cn from "./cn";
import en from "./en";
import pt from "./pt";
import tw from "./tw";
import da from "./da";
import id from "./id";
import fr from "./fr";
import es from "./es";
import it from "./it";
import tr from "./tr";
import jp from "./jp";
import de from "./de";
import vi from "./vi";
import ru from "./ru";
import no from "./no";
import cs from "./cs";
import ko from "./ko";
import ar from "./ar";
import bn from "./bn";
import sk from "./sk";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en,
    },
    cn: {
      translation: cn,
    },
    pt: {
      translation: pt,
    },
    tw: {
      translation: tw,
    },
    da: {
      translation: da,
    },
    id: {
      translation: id,
    },
    fr: {
      translation: fr,
    },
    es: {
      translation: es,
    },
    it: {
      translation: it,
    },
    tr: {
      translation: tr,
    },
    jp: {
      translation: jp,
    },
    de: {
      translation: de,
    },
    vi: {
      translation: vi,
    },
    ru: {
      translation: ru,
    },
    no: {
      translation: no,
    },
    cs: {
      translation: cs,
    },
    ko: {
      translation: ko,
    },
    ar: {
      translation: ar,
    },
    bn: {
      translation: bn,
    },
    sk: {
      translation: sk,
    },
  },
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

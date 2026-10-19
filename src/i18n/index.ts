import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import registerEn from "./locales/en/register.json";
import registerFr from "./locales/fr/register.json";
import discoverEn from "./locales/en/discover.json";
import discoverFr from "./locales/fr/discover.json";
import homeEn from "./locales/en/home.json";
import homeFr from "./locales/fr/home.json";
import profileEn from "./locales/en/profile.json";
import profileFr from "./locales/fr/profile.json";

const locale = navigator.language.split("-")[0] || "en";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      register: registerEn,
      discover: discoverEn,
      home: homeEn,
      profile: profileEn,
    },
    fr: {
      register: registerFr,
      discover: discoverFr,
      home: homeFr,
      profile: profileFr,
    },
  },
  lng: locale,
  fallbackLng: "en",
  ns: ["register", "discover", "home", "profile"],
  defaultNS: "discover",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

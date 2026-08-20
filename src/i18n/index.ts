import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import registerEn from "./locales/en/register.json";
import registerFr from "./locales/fr/register.json";

const locale = navigator.language.split("-")[0] || "en";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { register: registerEn },
      fr: { register: registerFr },
    },
    lng: locale,
    fallbackLng: "en",
    ns: ["register"],
    defaultNS: "register",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
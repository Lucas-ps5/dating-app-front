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
import receivedLikesEn from "./locales/en/receivedLikes.json";
import receivedLikesFr from "./locales/fr/receivedLikes.json";
import conversationsEn from "./locales/en/conversations.json";
import conversationsFr from "./locales/fr/conversations.json";
import matchesEn from "./locales/en/matches.json";
import matchesFr from "./locales/fr/matches.json";
import commonEn from "./locales/en/common.json";
import commonFr from "./locales/fr/common.json";
import chatEn from "./locales/en/chat.json";
import chatFr from "./locales/fr/chat.json";

const locale = navigator.language.split("-")[0] || "en";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      register: registerEn,
      discover: discoverEn,
      home: homeEn,
      profile: profileEn,
      receivedLikes: receivedLikesEn,
      conversations: conversationsEn,
      matches: matchesEn,
      common: commonEn,
      chat: chatEn,
    },
    fr: {
      register: registerFr,
      discover: discoverFr,
      home: homeFr,
      profile: profileFr,
      receivedLikes: receivedLikesFr,
      conversations: conversationsFr,
      matches: matchesFr,
      common: commonFr,
      chat: chatFr,
    },
  },
  lng: locale,
  fallbackLng: "en",
  ns: [
    "register",
    "discover",
    "home",
    "profile",
    "receivedLikes",
    "conversations",
    "matches",
    "common",
    "chat",
  ],
  defaultNS: "discover",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

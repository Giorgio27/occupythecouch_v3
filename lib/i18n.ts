import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import commonIT from "@/locales/it/common.json";
import commonEN from "@/locales/en/common.json";
import landingIT from "@/locales/it/landing.json";
import landingEN from "@/locales/en/landing.json";
import authIT from "@/locales/it/auth.json";
import authEN from "@/locales/en/auth.json";
import cineforumIT from "@/locales/it/cineforum.json";
import cineforumEN from "@/locales/en/cineforum.json";
import proposalIT from "@/locales/it/proposal.json";
import proposalEN from "@/locales/en/proposal.json";
import rankingsIT from "@/locales/it/rankings.json";
import rankingsEN from "@/locales/en/rankings.json";
import statsIT from "@/locales/it/stats.json";
import statsEN from "@/locales/en/stats.json";
import adminIT from "@/locales/it/admin.json";
import adminEN from "@/locales/en/admin.json";
import navigationIT from "@/locales/it/navigation.json";
import navigationEN from "@/locales/en/navigation.json";
import validationIT from "@/locales/it/validation.json";
import validationEN from "@/locales/en/validation.json";
import oscarsIT from "@/locales/it/oscars.json";
import oscarsEN from "@/locales/en/oscars.json";
import tutorialIT from "@/locales/it/tutorial.json";
import tutorialEN from "@/locales/en/tutorial.json";

const resources = {
  it: {
    common: commonIT,
    landing: landingIT,
    auth: authIT,
    cineforum: cineforumIT,
    proposal: proposalIT,
    rankings: rankingsIT,
    stats: statsIT,
    admin: adminIT,
    navigation: navigationIT,
    validation: validationIT,
    oscars: oscarsIT,
    tutorial: tutorialIT,
  },
  en: {
    common: commonEN,
    landing: landingEN,
    auth: authEN,
    cineforum: cineforumEN,
    proposal: proposalEN,
    rankings: rankingsEN,
    stats: statsEN,
    admin: adminEN,
    navigation: navigationEN,
    validation: validationEN,
    oscars: oscarsEN,
    tutorial: tutorialEN,
  },
};

i18n
  .use(LanguageDetector) // Detects browser language
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "it",
    defaultNS: "common",
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ["cookie", "localStorage", "navigator"], // cookie first so SSR and client agree
      caches: ["cookie", "localStorage"], // persist to both
      lookupCookie: "i18nextLng",
      lookupLocalStorage: "i18nextLng",
      cookieOptions: { path: "/", maxAge: 31536000, sameSite: "lax" },
    },
    debug: process.env.NODE_ENV === "development",
    saveMissing: true, // Log missing keys in development
  });

export default i18n;

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// ── English ──────────────────────────────────────────────────────────────────
import enCommon from './locales/en/common.json';
import enLanding from './locales/en/landing.json';
import enAuth from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enCompliance from './locales/en/compliance.json';
import enSettings from './locales/en/settings.json';

// ── Hindi ─────────────────────────────────────────────────────────────────────
import hiCommon from './locales/hi/common.json';
import hiLanding from './locales/hi/landing.json';
import hiAuth from './locales/hi/auth.json';
import hiDashboard from './locales/hi/dashboard.json';
import hiCompliance from './locales/hi/compliance.json';
import hiSettings from './locales/hi/settings.json';

// ── Tamil ─────────────────────────────────────────────────────────────────────
import taCommon from './locales/ta/common.json';
import taLanding from './locales/ta/landing.json';
import taAuth from './locales/ta/auth.json';
import taDashboard from './locales/ta/dashboard.json';
import taCompliance from './locales/ta/compliance.json';
import taSettings from './locales/ta/settings.json';

// ── Arabic ────────────────────────────────────────────────────────────────────
import arCommon from './locales/ar/common.json';
import arLanding from './locales/ar/landing.json';
import arAuth from './locales/ar/auth.json';
import arDashboard from './locales/ar/dashboard.json';
import arCompliance from './locales/ar/compliance.json';
import arSettings from './locales/ar/settings.json';

// ── RTL handler ───────────────────────────────────────────────────────────────
const applyDirection = (lng: string) => {
  const rtlLanguages = ['ar'];
  const isRtl = rtlLanguages.includes(lng);
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
};

// ── Init ──────────────────────────────────────────────────────────────────────
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, landing: enLanding, auth: enAuth, dashboard: enDashboard, compliance: enCompliance, settings: enSettings },
      hi: { common: hiCommon, landing: hiLanding, auth: hiAuth, dashboard: hiDashboard, compliance: hiCompliance, settings: hiSettings },
      ta: { common: taCommon, landing: taLanding, auth: taAuth, dashboard: taDashboard, compliance: taCompliance, settings: taSettings },
      ar: { common: arCommon, landing: arLanding, auth: arAuth, dashboard: arDashboard, compliance: arCompliance, settings: arSettings },
    },
    defaultNS: 'common',
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi', 'ta', 'ar'],
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'sitesecure_lang',
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  });

// Apply direction on init and on language change
applyDirection(i18n.language);
i18n.on('languageChanged', applyDirection);

export default i18n;

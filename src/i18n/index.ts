import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/i18n/en';

let deviceLanguage = 'en';
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getLocales } = require('expo-localization');
  deviceLanguage = getLocales()[0]?.languageCode ?? 'en';
} catch {
  // Native module not available (e.g. dev client not rebuilt) — fall back to English
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
  },
  lng: deviceLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

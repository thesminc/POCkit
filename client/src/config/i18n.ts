/**
 * i18n Configuration for React Frontend
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import locale files
import commonEN from '../locales/en/common.json';
import uiEN from '../locales/en/ui.json';
import pagesEN from '../locales/en/pages.json';
import errorsEN from '../locales/en/errors.json';
import validationEN from '../locales/en/validation.json';

const resources = {
  en: {
    common: commonEN,
    ui: uiEN,
    pages: pagesEN,
    errors: errorsEN,
    validation: validationEN,
  },
};

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'ui', 'pages', 'errors', 'validation'],

    interpolation: {
      escapeValue: false, // React already escapes
    },

    detection: {
      // Order of language detection
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    react: {
      useSuspense: false, // Avoid suspense issues
    },

    // Development options
    debug: import.meta.env.DEV,
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: (lng, ns, key) => {
      if (import.meta.env.DEV) {
        console.warn(`Missing translation: [${lng}] ${ns}.${key}`);
      }
    },
  });

export default i18n;

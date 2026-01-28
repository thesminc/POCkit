/**
 * Custom useTranslation hook with enhanced features
 */

import { useTranslation as useI18nTranslation } from 'react-i18next';

export function useTranslation(namespace?: string | string[]) {
  const { t, i18n } = useI18nTranslation(namespace);

  /**
   * Translation helper with automatic fallback
   */
  const translate = (key: string, fallback?: string, options?: any) => {
    return t(key, { defaultValue: fallback, ...options });
  };

  /**
   * Change language
   */
  const changeLanguage = (lng: string) => {
    return i18n.changeLanguage(lng);
  };

  /**
   * Get current language
   */
  const currentLanguage = i18n.language;

  /**
   * Get available languages
   */
  const availableLanguages = Object.keys(i18n.options.resources || {});

  return {
    t: translate,
    i18n,
    changeLanguage,
    currentLanguage,
    availableLanguages,
  };
}

export default useTranslation;

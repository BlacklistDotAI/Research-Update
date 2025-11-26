import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import viTranslations from './locales/vi.json';
import enTranslations from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      vi: {
        translation: viTranslations,
      },
      en: {
        translation: enTranslations,
      },
    },
    lng: 'vi', // Mặc định là tiếng Việt
    fallbackLng: 'vi',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage'], // Chỉ lấy từ localStorage nếu user đã chọn trước đó
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;


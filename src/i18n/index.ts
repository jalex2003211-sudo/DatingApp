import i18n from 'i18next';
import * as Localization from 'expo-localization';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import el from './locales/el';

const deviceLanguage = Localization.getLocales()[0]?.languageCode;
const fallbackLng = deviceLanguage === 'el' ? 'el' : 'en';

void i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    en: { translation: en },
    el: { translation: el },
  },
  lng: fallbackLng,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;

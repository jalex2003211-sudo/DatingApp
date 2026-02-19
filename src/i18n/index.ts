import i18n from 'i18next';
import * as Localization from 'expo-localization';
import { initReactI18next } from 'react-i18next';
import { resources } from './resources';

const locale = Localization.getLocales()[0]?.languageCode ?? 'en';
const fallbackLng = locale.startsWith('el') ? 'el' : 'en';

void i18n.use(initReactI18next).init({
  resources,
  lng: fallbackLng,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
});

export default i18n;

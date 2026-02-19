import i18n from 'i18next';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

type LanguageCode = 'en' | 'el';

interface SettingsState {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: async (language) => {
        await i18n.changeLanguage(language);
        set({ language });
      },
    }),
    {
      name: STORAGE_KEYS.language,
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.language) {
          void i18n.changeLanguage(state.language);
        }
      },
    },
  ),
);

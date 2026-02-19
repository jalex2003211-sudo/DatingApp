import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type SupportedLanguage = 'en' | 'el';

type PrefsState = {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
};

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language })
    }),
    {
      name: 'between-us-prefs',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);

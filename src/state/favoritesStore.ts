import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type FavoritesState = {
  favoriteIds: string[];
  toggleFavorite: (questionId: string) => void;
  removeFavorite: (questionId: string) => void;
  isFavorite: (questionId: string) => boolean;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],
      toggleFavorite: (questionId) => {
        const exists = get().favoriteIds.includes(questionId);
        set({
          favoriteIds: exists
            ? get().favoriteIds.filter((id) => id !== questionId)
            : [...get().favoriteIds, questionId]
        });
      },
      removeFavorite: (questionId) =>
        set({ favoriteIds: get().favoriteIds.filter((id) => id !== questionId) }),
      isFavorite: (questionId) => get().favoriteIds.includes(questionId)
    }),
    {
      name: 'between-us-favorites',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);

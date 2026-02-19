import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

interface FavoritesState {
  favoriteIds: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  clearAll: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],
      toggleFavorite: (id) => {
        const has = get().favoriteIds.includes(id);
        set({
          favoriteIds: has
            ? get().favoriteIds.filter((item) => item !== id)
            : [...get().favoriteIds, id],
        });
      },
      isFavorite: (id) => get().favoriteIds.includes(id),
      clearAll: () => set({ favoriteIds: [] }),
    }),
    {
      name: STORAGE_KEYS.favorites,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getAllNormalizedQuestions } from '../engine/normalizeQuestions';

export type FavoriteLikedBy = 'male' | 'female' | 'neutral';

export type FavoriteEntry = {
  id: string;
  likedBy: FavoriteLikedBy;
  createdAt: number;
};

type LegacyFavoriteState = {
  favoriteIds?: unknown;
  favorites?: unknown;
};

type FavoritesState = {
  favorites: FavoriteEntry[];
  toggleFavorite: (questionId: string, likedBy?: FavoriteLikedBy) => void;
  removeFavorite: (questionId: string) => void;
  isFavorite: (questionId: string) => boolean;
  getFavoriteEntry: (questionId: string) => FavoriteEntry | null;
  listFavorites: () => FavoriteEntry[];
  clearFavorites: () => void;
};

const FAVORITES_STORAGE_VERSION = 2;

const questionTextToIdMap = new Map<string, string>(
  getAllNormalizedQuestions().flatMap((question) => [
    [question.id, question.id],
    [question.text.el, question.id],
    [question.text.en, question.id]
  ])
);

const toFavoriteEntry = (value: unknown): FavoriteEntry | null => {
  if (typeof value === 'string') {
    const mappedId = questionTextToIdMap.get(value);
    if (!mappedId) return null;
    return { id: mappedId, likedBy: 'neutral', createdAt: Date.now() };
  }

  if (!value || typeof value !== 'object') return null;

  const maybeEntry = value as Partial<FavoriteEntry> & { questionId?: unknown };
  const rawId = typeof maybeEntry.id === 'string' ? maybeEntry.id : maybeEntry.questionId;

  if (typeof rawId !== 'string') return null;

  const mappedId = questionTextToIdMap.get(rawId);
  if (!mappedId) return null;

  const likedBy: FavoriteLikedBy =
    maybeEntry.likedBy === 'male' || maybeEntry.likedBy === 'female' || maybeEntry.likedBy === 'neutral'
      ? maybeEntry.likedBy
      : 'neutral';

  return {
    id: mappedId,
    likedBy,
    createdAt: typeof maybeEntry.createdAt === 'number' ? maybeEntry.createdAt : Date.now()
  };
};

const normalizeRawFavorites = (rawValues: unknown): unknown[] => {
  if (Array.isArray(rawValues)) return rawValues;

  if (rawValues instanceof Set) {
    return Array.from(rawValues.values());
  }

  if (rawValues && typeof rawValues === 'object') {
    const setLikeValues = (rawValues as { values?: unknown }).values;

    if (typeof setLikeValues === 'function') {
      try {
        return Array.from((setLikeValues as () => Iterable<unknown>)());
      } catch {
        return [];
      }
    }

    if ('items' in rawValues && Array.isArray((rawValues as { items?: unknown[] }).items)) {
      return (rawValues as { items: unknown[] }).items;
    }

    return Object.values(rawValues as Record<string, unknown>);
  }

  return [];
};

const normalizeEntries = (rawValues: unknown): FavoriteEntry[] => {
  const listValues = normalizeRawFavorites(rawValues);
  if (!listValues.length) return [];

  const unique = new Map<string, FavoriteEntry>();

  listValues.forEach((value, index) => {
    const entry = toFavoriteEntry(value);
    if (!entry) return;
    unique.set(entry.id, {
      ...entry,
      createdAt: entry.createdAt + index
    });
  });

  return Array.from(unique.values()).sort((a, b) => b.createdAt - a.createdAt);
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (questionId, likedBy = 'neutral') => {
        if (!questionId) {
          if (__DEV__) {
            console.warn('[fav] toggle skipped: invalid id', { id: questionId });
          }
          return;
        }
        const exists = get().favorites.some((favorite) => favorite.id === questionId);

        if (__DEV__) {
          console.log('[fav] toggle', { id: questionId, existsBefore: exists, likedByFinal: likedBy ?? 'neutral' });
        }

        set({
          favorites: exists
            ? get().favorites.filter((favorite) => favorite.id !== questionId)
            : [{ id: questionId, likedBy, createdAt: Date.now() }, ...get().favorites]
        });
      },
      removeFavorite: (questionId) =>
        set({ favorites: get().favorites.filter((favorite) => favorite.id !== questionId) }),
      isFavorite: (questionId) => get().favorites.some((favorite) => favorite.id === questionId),
      getFavoriteEntry: (questionId) => get().favorites.find((favorite) => favorite.id === questionId) ?? null,
      listFavorites: () => [...get().favorites].sort((a, b) => b.createdAt - a.createdAt),
      clearFavorites: () => set({ favorites: [] })
    }),
    {
      name: 'between-us-favorites',
      version: FAVORITES_STORAGE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as LegacyFavoriteState;
        const rawFavorites = state.favorites ?? state.favoriteIds;

        const migratedFavorites = normalizeEntries(rawFavorites);

        if (__DEV__ && rawFavorites && migratedFavorites.length === 0) {
          console.warn('[fav] migration produced empty favorites from persisted payload', { rawFavorites });
        }

        return {
          favorites: migratedFavorites
        };
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          if (__DEV__) {
            console.warn('[fav] rehydrate failed; resetting favorites', { error });
          }
          state?.clearFavorites();
          return;
        }

        if (!state) return;

        if (!Array.isArray(state.favorites)) {
          if (__DEV__) {
            console.warn('[fav] invalid favorites state after rehydrate; resetting');
          }
          state.clearFavorites();
          return;
        }

        state.favorites = normalizeEntries(state.favorites);
      }
    }
  )
);

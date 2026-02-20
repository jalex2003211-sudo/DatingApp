import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getAllNormalizedQuestions } from '../engine/normalizeQuestions';
import { UserProfile } from '../types/profile';

export type FavoriteLikedBy = 'A' | 'B';
type LegacyFavoriteLikedBy = 'male' | 'female' | 'neutral';

type AnyFavoriteLikedBy = FavoriteLikedBy | LegacyFavoriteLikedBy;

export type FavoriteEntry = {
  id: string;
  likedBy: AnyFavoriteLikedBy;
  createdAt: number;
};

type LegacyFavoriteState = {
  favoriteIds?: unknown;
  favorites?: unknown;
  favoritesById?: unknown;
};

export type FavoritesById = Record<string, FavoriteEntry>;

type FavoritesState = {
  favoritesById: FavoritesById;
  ensureFavorite: (questionId: string, likedBy: FavoriteLikedBy) => void;
  toggleFavorite: (questionId: string, likedBy?: FavoriteLikedBy) => void;
  removeFavorite: (questionId: string) => void;
  migrateLegacyLikedBy: (profile: UserProfile) => void;
  clearFavorites: () => void;
};

const FAVORITES_STORAGE_VERSION = 4;

const questionTextToIdMap = new Map<string, string>(
  getAllNormalizedQuestions().flatMap((question) => [
    [question.id, question.id],
    [question.text.el, question.id],
    [question.text.en, question.id]
  ])
);

const resolveLegacyLikedBy = (likedBy: AnyFavoriteLikedBy, profile: UserProfile): FavoriteLikedBy => {
  if (likedBy === 'A' || likedBy === 'B') return likedBy;

  if (likedBy === 'male' || likedBy === 'female') {
    if (profile.partnerA.gender === likedBy) return 'A';
    if (profile.partnerB.gender === likedBy) return 'B';
    return 'A';
  }

  return 'A';
};

const toFavoriteEntry = (value: unknown): FavoriteEntry | null => {
  if (typeof value === 'string') {
    const mappedId = questionTextToIdMap.get(value);
    if (!mappedId) return null;
    return { id: mappedId, likedBy: 'A', createdAt: Date.now() };
  }

  if (!value || typeof value !== 'object') return null;

  const maybeEntry = value as Partial<FavoriteEntry> & { questionId?: unknown };
  const rawId = typeof maybeEntry.id === 'string' ? maybeEntry.id : maybeEntry.questionId;

  if (typeof rawId !== 'string') return null;

  const mappedId = questionTextToIdMap.get(rawId);
  if (!mappedId) return null;

  const likedBy: AnyFavoriteLikedBy =
    maybeEntry.likedBy === 'A' ||
    maybeEntry.likedBy === 'B' ||
    maybeEntry.likedBy === 'male' ||
    maybeEntry.likedBy === 'female' ||
    maybeEntry.likedBy === 'neutral'
      ? maybeEntry.likedBy
      : 'A';

  return {
    id: mappedId,
    likedBy,
    createdAt: typeof maybeEntry.createdAt === 'number' ? maybeEntry.createdAt : Date.now()
  };
};

const normalizeRawFavorites = (rawValues: unknown): unknown[] => {
  if (Array.isArray(rawValues)) return rawValues;
  if (rawValues && typeof rawValues === 'object') return Object.values(rawValues as Record<string, unknown>);
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

const toFavoritesById = (entries: FavoriteEntry[]): FavoritesById =>
  entries.reduce<FavoritesById>((acc, entry) => {
    acc[entry.id] = entry;
    return acc;
  }, {});

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      favoritesById: {},
      ensureFavorite: (questionId, likedBy) => {
        if (!questionId) return;
        set((state) => {
          if (state.favoritesById[questionId]) return state;
          return {
            favoritesById: {
              ...state.favoritesById,
              [questionId]: {
                id: questionId,
                likedBy,
                createdAt: Date.now()
              }
            }
          };
        });
      },
      toggleFavorite: (questionId, likedBy = 'A') => {
        if (!questionId) return;

        set((state) => {
          const nextFavoritesById = { ...state.favoritesById };

          if (nextFavoritesById[questionId]) {
            delete nextFavoritesById[questionId];
          } else {
            nextFavoritesById[questionId] = {
              id: questionId,
              likedBy,
              createdAt: Date.now()
            };
          }

          return { favoritesById: nextFavoritesById };
        });
      },
      removeFavorite: (questionId) =>
        set((state) => {
          if (!state.favoritesById[questionId]) return state;
          const nextFavoritesById = { ...state.favoritesById };
          delete nextFavoritesById[questionId];
          return { favoritesById: nextFavoritesById };
        }),
      migrateLegacyLikedBy: (profile) =>
        set((state) => {
          const nextEntries = Object.values(state.favoritesById).map((entry) => ({
            ...entry,
            likedBy: resolveLegacyLikedBy(entry.likedBy, profile)
          }));

          return { favoritesById: toFavoritesById(nextEntries) };
        }),
      clearFavorites: () => set({ favoritesById: {} })
    }),
    {
      name: 'between-us-favorites',
      version: FAVORITES_STORAGE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as LegacyFavoriteState;
        const rawFavorites = state.favoritesById ?? state.favorites ?? state.favoriteIds;
        return {
          favoritesById: toFavoritesById(normalizeEntries(rawFavorites))
        };
      }
    }
  )
);

export const useIsFavorite = (id?: string | null) =>
  useFavoritesStore((s) => (id ? Boolean(s.favoritesById[id]) : false));

export const useFavoriteMeta = (id?: string | null) =>
  useFavoritesStore((s) => (id ? s.favoritesById[id] ?? null : null));

import type { DurationKey, MoodKey } from '../types';

export const STORAGE_KEYS = {
  favorites: '@between-us/favorites',
  language: '@between-us/language',
} as const;

export const MOODS: MoodKey[] = ['romantic', 'funny', 'deep', 'spicy'];

export const DURATION_SECONDS: Record<DurationKey, number> = {
  short: 5 * 60,
  medium: 10 * 60,
  long: 15 * 60,
};

export const DURATION_CARD_COUNTS: Record<DurationKey, number> = {
  short: 12,
  medium: 24,
  long: 36,
};

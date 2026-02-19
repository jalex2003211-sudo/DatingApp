import { create } from 'zustand';
import type { DurationKey, MoodKey, PlayerSide, PromptCard, SessionStats } from '../types';
import { getDeckForMood } from '../data/decks';
import { DURATION_CARD_COUNTS, DURATION_SECONDS } from '../utils/constants';
import { seededShuffle } from '../utils/shuffle';

interface SessionState {
  mood: MoodKey | null;
  duration: DurationKey | null;
  seed: string;
  cards: PromptCard[];
  currentIndex: number;
  firstResponder: PlayerSide;
  favoritesAddedInSession: number;
  startTimeMs: number | null;
  totalDurationSeconds: number;
  startSession: (mood: MoodKey, duration: DurationKey) => void;
  nextCard: () => void;
  registerFavoriteAdded: () => void;
  resetSession: () => void;
  buildStats: (remainingSeconds: number) => SessionStats;
}

const initialState = {
  mood: null,
  duration: null,
  seed: '',
  cards: [],
  currentIndex: 0,
  firstResponder: 'you' as PlayerSide,
  favoritesAddedInSession: 0,
  startTimeMs: null,
  totalDurationSeconds: 0,
};

export const useSessionStore = create<SessionState>((set, get) => ({
  ...initialState,
  startSession: (mood, duration) => {
    const seed = `${mood}-${duration}-${Date.now()}`;
    const sourceDeck = getDeckForMood(mood);
    const shuffled = seededShuffle(sourceDeck, seed);
    const maxCount = Math.min(DURATION_CARD_COUNTS[duration], shuffled.length);
    const selected = shuffled.slice(0, maxCount);
    set({
      mood,
      duration,
      seed,
      cards: selected,
      currentIndex: 0,
      firstResponder: 'you',
      favoritesAddedInSession: 0,
      startTimeMs: Date.now(),
      totalDurationSeconds: DURATION_SECONDS[duration],
    });
  },
  nextCard: () => set({ currentIndex: get().currentIndex + 1 }),
  registerFavoriteAdded: () => set({ favoritesAddedInSession: get().favoritesAddedInSession + 1 }),
  resetSession: () => set({ ...initialState }),
  buildStats: (remainingSeconds) => {
    const { cards, currentIndex, favoritesAddedInSession, totalDurationSeconds } = get();
    return {
      totalCards: cards.length,
      answeredCards: Math.min(currentIndex + 1, cards.length),
      favoritesAdded: favoritesAddedInSession,
      elapsedSeconds: totalDurationSeconds - remainingSeconds,
    };
  },
}));

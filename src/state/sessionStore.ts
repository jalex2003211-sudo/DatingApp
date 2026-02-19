import { create } from 'zustand';
import { decksByMood } from '../data/decks';
import { Mood } from '../types';
import { shuffle } from '../utils/shuffle';
import { minutesToSeconds } from '../utils/time';

type SessionStats = {
  viewed: number;
  skipped: number;
  favoritesAdded: number;
};

type SessionState = {
  mood: Mood | null;
  duration: number;
  timerSecondsLeft: number;
  currentIndex: number;
  shuffledIds: string[];
  paused: boolean;
  completed: boolean;
  stats: SessionStats;
  startSession: (mood: Mood, duration: number) => void;
  nextCard: () => void;
  skipCard: () => void;
  tick: () => void;
  togglePause: () => void;
  registerFavoriteAdded: () => void;
  endSession: () => void;
  resetSession: () => void;
};

const initialStats: SessionStats = { viewed: 0, skipped: 0, favoritesAdded: 0 };

const initialState = {
  mood: null,
  duration: 10,
  timerSecondsLeft: minutesToSeconds(10),
  currentIndex: 0,
  shuffledIds: [],
  paused: false,
  completed: false,
  stats: initialStats
};

export const useSessionStore = create<SessionState>((set, get) => ({
  ...initialState,
  startSession: (mood, duration) => {
    const shuffled = shuffle(decksByMood[mood].map((q) => q.id));
    set({
      mood,
      duration,
      timerSecondsLeft: minutesToSeconds(duration),
      currentIndex: 0,
      shuffledIds: shuffled,
      paused: false,
      completed: false,
      stats: { ...initialStats, viewed: shuffled.length > 0 ? 1 : 0 }
    });
  },
  nextCard: () => {
    const { currentIndex, shuffledIds, stats } = get();
    const nextIndex = Math.min(currentIndex + 1, shuffledIds.length - 1);
    set({
      currentIndex: nextIndex,
      stats:
        nextIndex !== currentIndex
          ? { ...stats, viewed: Math.max(stats.viewed, nextIndex + 1) }
          : stats
    });
  },
  skipCard: () => {
    const { skipped } = get().stats;
    get().nextCard();
    set((state) => ({ stats: { ...state.stats, skipped: skipped + 1 } }));
  },
  tick: () => {
    const { paused, timerSecondsLeft } = get();
    if (paused || timerSecondsLeft <= 0) return;
    set({ timerSecondsLeft: timerSecondsLeft - 1 });
  },
  togglePause: () => set((state) => ({ paused: !state.paused })),
  registerFavoriteAdded: () =>
    set((state) => ({
      stats: { ...state.stats, favoritesAdded: state.stats.favoritesAdded + 1 }
    })),
  endSession: () => set({ completed: true, paused: true }),
  resetSession: () => set(initialState)
}));

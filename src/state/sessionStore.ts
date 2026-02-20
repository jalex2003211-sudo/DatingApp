import { create } from 'zustand';
import { getNormalizedQuestionsForMood } from '../engine/normalizeQuestions';
import { SessionEngine } from '../engine/sessionEngine';
import { Mood, RelationshipStage, StageType } from '../types';
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
  currentQuestionId: string | null;
  questionsShown: string[];
  currentPhase: StageType;
  targetIntensity: number;
  relationshipStage: RelationshipStage;
  isPremium: boolean;
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
  currentQuestionId: null,
  questionsShown: [] as string[],
  currentPhase: 'warmup' as StageType,
  targetIntensity: 2,
  relationshipStage: 'longTerm' as RelationshipStage,
  isPremium: false,
  paused: false,
  completed: false,
  stats: initialStats
};

const STAGE_FLOW: Record<Mood, StageType[]> = {
  FUN: ['warmup', 'curiosity', 'relief'],
  DEEP: ['warmup', 'curiosity', 'deep', 'relief', 'vulnerable', 'relief'],
  INTIMATE: ['warmup', 'curiosity', 'intimate', 'relief']
};

const getAdaptiveTargets = (
  mood: Mood,
  shownCount: number,
  totalQuestions: number
): { currentPhase: StageType; targetIntensity: number } => {
  const phaseFlow = STAGE_FLOW[mood];
  const progress = totalQuestions > 0 ? shownCount / totalQuestions : 0;
  const phaseIndex = Math.min(phaseFlow.length - 1, Math.floor(progress * phaseFlow.length));

  const intensityCap = mood === 'FUN' ? 2 : 4;
  const targetIntensity = Math.max(
    1,
    Math.min(intensityCap, Math.round(1 + progress * (intensityCap - 1)))
  );

  return {
    currentPhase: phaseFlow[phaseIndex],
    targetIntensity
  };
};

export const useSessionStore = create<SessionState>((set, get) => ({
  ...initialState,
  startSession: (mood, duration) => {
    const normalized = getNormalizedQuestionsForMood(mood);
    const engine = new SessionEngine(normalized, {
      mood,
      relationshipStage: initialState.relationshipStage,
      isPremium: initialState.isPremium
    });

    const initialTargets = getAdaptiveTargets(mood, 0, normalized.length);
    const firstQuestion = engine.getNextQuestion({
      ...initialTargets,
      questionsShown: []
    });

    const shown = firstQuestion ? [firstQuestion.id] : [];

    set({
      mood,
      duration,
      timerSecondsLeft: minutesToSeconds(duration),
      currentQuestionId: firstQuestion?.id ?? null,
      questionsShown: shown,
      currentPhase: initialTargets.currentPhase,
      targetIntensity: initialTargets.targetIntensity,
      paused: false,
      completed: false,
      stats: { ...initialStats, viewed: shown.length > 0 ? 1 : 0 }
    });
  },
  nextCard: () => {
    const state = get();
    if (!state.mood) return;

    const normalized = getNormalizedQuestionsForMood(state.mood);
    const nextTargets = getAdaptiveTargets(state.mood, state.questionsShown.length, normalized.length);
    const engine = new SessionEngine(normalized, {
      mood: state.mood,
      relationshipStage: state.relationshipStage,
      isPremium: state.isPremium
    });

    const nextQuestion = engine.getNextQuestion({
      currentPhase: nextTargets.currentPhase,
      targetIntensity: nextTargets.targetIntensity,
      questionsShown: state.questionsShown
    });

    if (!nextQuestion || nextQuestion.id === state.currentQuestionId) {
      set({ currentPhase: nextTargets.currentPhase, targetIntensity: nextTargets.targetIntensity });
      return;
    }

    set({
      currentQuestionId: nextQuestion.id,
      questionsShown: [...state.questionsShown, nextQuestion.id],
      currentPhase: nextTargets.currentPhase,
      targetIntensity: nextTargets.targetIntensity,
      stats: { ...state.stats, viewed: state.stats.viewed + 1 }
    });
  },
  skipCard: () => {
    get().nextCard();
    set((state) => ({
      stats: { ...state.stats, skipped: state.stats.skipped + 1 }
    }));
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

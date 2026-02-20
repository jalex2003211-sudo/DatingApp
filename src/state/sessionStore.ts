import { create } from 'zustand';
import { EmotionalJourneySession, JourneySnapshot, StartSessionResult } from '../application/session/EmotionalJourneySession';
import { DEFAULT_RELATIONSHIP_PROFILE } from '../domain/profile/RelationshipProfile';
import { SessionSummary } from '../domain/session/types';
import { getNormalizedQuestionsForMood } from '../engine/normalizeQuestions';
import { Mood, RelationshipStage, StageType } from '../types';
import { minutesToSeconds } from '../utils/time';

export type SessionEndReason = 'TIME_UP' | 'DECK_EXHAUSTED' | 'USER_ENDED';

type SessionStats = {
  viewed: number;
  skipped: number;
  favoritesAdded: number;
  averageIntensity: number;
  peakPhase: StageType;
  safetyLevel: number;
};

type LastSessionSummary = {
  reason: SessionEndReason;
  viewed: number;
  skipped: number;
  favoritesAdded: number;
  durationPlayed: number;
  mood: Mood | null;
  relationshipStage: RelationshipStage;
  avgIntensity: number;
  peakPhase: StageType;
  safetyLevel: number;
  reflectionMessage?: string;
};

export type SessionSummaryPayload = {
  mood: Mood | null;
  viewed: number;
  skipped: number;
  favorites: number;
  peakPhaseReached: StageType;
  avgIntensityExperienced: number;
  endReason: SessionEndReason;
};

type SessionState = {
  mood: Mood | null;
  duration: number;
  timerSecondsLeft: number;
  currentQuestionId: string | null;
  nextQuestionId: string | null;
  questionsShown: string[];
  currentPhase: StageType;
  targetIntensity: number;
  relationshipStage: RelationshipStage;
  isPremium: boolean;
  peakPhaseReached: StageType;
  avgIntensityExperienced: number;
  paused: boolean;
  completed: boolean;
  summary: SessionSummary | null;
  sessionSummary: SessionSummaryPayload | null;
  lastSessionSummary: LastSessionSummary | null;
  stats: SessionStats;
  isDeckExhausted: boolean;
  endReason: SessionEndReason | null;
  lastError: 'PREMIUM_REQUIRED' | 'INVALID_STATE' | null;
  startSession: (mood: Mood, duration: number) => StartSessionResult;
  nextCard: () => void;
  skipCard: () => void;
  tick: () => void;
  togglePause: () => void;
  registerFavoriteAdded: () => void;
  endSession: (opts?: { reason?: SessionEndReason }) => void;
  resetSession: () => void;
};

const initialStats: SessionStats = {
  viewed: 0,
  skipped: 0,
  favoritesAdded: 0,
  averageIntensity: 0,
  peakPhase: 'warmup',
  safetyLevel: 0.65
};

const initialState = {
  mood: null,
  duration: 10,
  timerSecondsLeft: minutesToSeconds(10),
  currentQuestionId: null,
  nextQuestionId: null,
  questionsShown: [] as string[],
  currentPhase: 'warmup' as StageType,
  targetIntensity: 2,
  relationshipStage: 'longTerm' as RelationshipStage,
  isPremium: false,
  peakPhaseReached: 'warmup' as StageType,
  avgIntensityExperienced: 0,
  paused: false,
  completed: false,
  summary: null,
  sessionSummary: null,
  lastSessionSummary: null,
  stats: initialStats,
  isDeckExhausted: false,
  endReason: null,
  lastError: null
};

let activeJourneySession: EmotionalJourneySession | null = null;

const patchFromSnapshot = (snapshot: JourneySnapshot) => ({
  currentQuestionId: snapshot.currentQuestion?.id ?? null,
  nextQuestionId: snapshot.upcomingQuestion?.id ?? null,
  questionsShown: snapshot.memory.shownQuestionIds,
  currentPhase: snapshot.emotionalState.phase,
  targetIntensity: Number(snapshot.emotionalState.intensity.toFixed(2)),
  peakPhaseReached: snapshot.memory.peakPhaseReached,
  avgIntensityExperienced: Number(snapshot.memory.averageIntensityExperienced.toFixed(2)),
  stats: {
    viewed: snapshot.memory.shownQuestionIds.length,
    skipped: snapshot.memory.skipsCount,
    favoritesAdded: snapshot.memory.favoritesAdded,
    averageIntensity: Number(snapshot.memory.averageIntensityExperienced.toFixed(2)),
    peakPhase: snapshot.memory.peakPhaseReached,
    safetyLevel: Number(snapshot.emotionalState.safetyLevel.toFixed(2))
  }
});

export const useSessionStore = create<SessionState>((set, get) => ({
  ...initialState,
  startSession: (mood, duration) => {
    const questions = getNormalizedQuestionsForMood(mood);
    activeJourneySession = new EmotionalJourneySession({
      mood,
      isPremium: get().isPremium,
      relationshipStage: get().relationshipStage,
      relationshipProfile: {
        ...DEFAULT_RELATIONSHIP_PROFILE,
        stage: get().relationshipStage
      },
      questions
    });

    const { result, snapshot } = activeJourneySession.start();

    if (!result.ok) {
      set({ lastError: result.reason });
      return result;
    }

    if (!snapshot) {
      const invalidStateResult: StartSessionResult = {
        ok: false,
        reason: 'INVALID_STATE',
        message: 'Session could not be started due to an invalid state.'
      };
      set({ lastError: invalidStateResult.reason });
      return invalidStateResult;
    }

    set({
      mood,
      duration,
      timerSecondsLeft: minutesToSeconds(duration),
      paused: false,
      completed: false,
      summary: null,
      sessionSummary: null,
      isDeckExhausted: false,
      endReason: null,
      lastError: null,
      ...patchFromSnapshot(snapshot)
    });

    return result;
  },
  nextCard: () => {
    if (!activeJourneySession) return;
    const snapshot = activeJourneySession.next();
    const patch = patchFromSnapshot(snapshot);

    set({
      ...patch,
      isDeckExhausted: snapshot.remainingQuestionsCount <= 0 || patch.currentQuestionId === null
    });

    if (snapshot.remainingQuestionsCount <= 0 || patch.currentQuestionId === null) {
      get().endSession({ reason: 'DECK_EXHAUSTED' });
    }
  },
  skipCard: () => {
    if (!activeJourneySession) return;
    const snapshot = activeJourneySession.skip();
    const patch = patchFromSnapshot(snapshot);

    set({
      ...patch,
      isDeckExhausted: snapshot.remainingQuestionsCount <= 0 || patch.currentQuestionId === null
    });

    if (snapshot.remainingQuestionsCount <= 0 || patch.currentQuestionId === null) {
      get().endSession({ reason: 'DECK_EXHAUSTED' });
    }
  },
  tick: () => {
    const { paused, timerSecondsLeft } = get();
    if (paused || timerSecondsLeft <= 0) return;
    set({ timerSecondsLeft: timerSecondsLeft - 1 });
  },
  togglePause: () => set((state) => ({ paused: !state.paused })),
  registerFavoriteAdded: () => {
    if (!activeJourneySession) return;
    const snapshot = activeJourneySession.favorite();
    set({ ...patchFromSnapshot(snapshot) });
  },
  endSession: ({ reason = 'USER_ENDED' } = {}) => {
    const currentState = get();
    if (currentState.completed && currentState.endReason === reason) return;

    const summary = activeJourneySession?.complete() ?? null;

    const resolvedAvgIntensity = summary?.averageIntensity ?? currentState.stats.averageIntensity;
    const resolvedPeakPhase = summary?.peakPhase ?? currentState.stats.peakPhase;
    const resolvedSafetyLevel = summary?.safetyLevel ?? currentState.stats.safetyLevel;
    const resolvedAvgExperienced = summary?.averageIntensity ?? currentState.avgIntensityExperienced;

    const sessionSummary: SessionSummaryPayload = {
      mood: currentState.mood,
      viewed: currentState.stats.viewed,
      skipped: currentState.stats.skipped,
      favorites: currentState.stats.favoritesAdded,
      peakPhaseReached: resolvedPeakPhase,
      avgIntensityExperienced: resolvedAvgExperienced,
      endReason: reason
    };

    const lastSessionSummary: LastSessionSummary = {
      reason,
      viewed: currentState.stats.viewed,
      skipped: currentState.stats.skipped,
      favoritesAdded: currentState.stats.favoritesAdded,
      durationPlayed: Math.max(0, minutesToSeconds(currentState.duration) - currentState.timerSecondsLeft),
      mood: currentState.mood,
      relationshipStage: currentState.relationshipStage,
      avgIntensity: resolvedAvgIntensity,
      peakPhase: resolvedPeakPhase,
      safetyLevel: resolvedSafetyLevel,
      reflectionMessage: summary?.reflectionMessage
    };

    set((state) => ({
      completed: true,
      paused: true,
      summary,
      sessionSummary,
      endReason: reason,
      isDeckExhausted: reason === 'DECK_EXHAUSTED' ? true : state.isDeckExhausted,
      lastSessionSummary,
      stats: {
        ...state.stats,
        averageIntensity: resolvedAvgIntensity,
        peakPhase: resolvedPeakPhase,
        safetyLevel: resolvedSafetyLevel
      },
      peakPhaseReached: resolvedPeakPhase,
      avgIntensityExperienced: resolvedAvgExperienced
    }));
  },
  resetSession: () => {
    activeJourneySession = null;
    set((state) => ({ ...initialState, lastSessionSummary: state.lastSessionSummary }));
  }
}));

import { create } from 'zustand';
import { EmotionalJourneySession, JourneySnapshot } from '../application/session/EmotionalJourneySession';
import { DEFAULT_RELATIONSHIP_PROFILE } from '../domain/profile/RelationshipProfile';
import { SessionSummary } from '../domain/session/types';
import { getNormalizedQuestionsForMood } from '../engine/normalizeQuestions';
import { Mood, RelationshipStage, StageType } from '../types';
import { minutesToSeconds } from '../utils/time';

type SessionStats = {
  viewed: number;
  skipped: number;
  favoritesAdded: number;
  averageIntensity: number;
  peakPhase: StageType;
  safetyLevel: number;
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
  paused: boolean;
  completed: boolean;
  summary: SessionSummary | null;
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
  paused: false,
  completed: false,
  summary: null,
  stats: initialStats
};

let activeJourneySession: EmotionalJourneySession | null = null;

const patchFromSnapshot = (snapshot: JourneySnapshot) => ({
  currentQuestionId: snapshot.currentQuestion?.id ?? null,
  nextQuestionId: snapshot.upcomingQuestion?.id ?? null,
  questionsShown: snapshot.memory.shownQuestionIds,
  currentPhase: snapshot.emotionalState.phase,
  targetIntensity: Number(snapshot.emotionalState.intensity.toFixed(2)),
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

    const snapshot = activeJourneySession.start();

    set({
      mood,
      duration,
      timerSecondsLeft: minutesToSeconds(duration),
      paused: false,
      completed: false,
      summary: null,
      ...patchFromSnapshot(snapshot)
    });
  },
  nextCard: () => {
    if (!activeJourneySession) return;
    const snapshot = activeJourneySession.next();
    set({ ...patchFromSnapshot(snapshot) });
  },
  skipCard: () => {
    if (!activeJourneySession) return;
    const snapshot = activeJourneySession.skip();
    set({ ...patchFromSnapshot(snapshot) });
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
  endSession: () => {
    const summary = activeJourneySession?.complete() ?? null;
    set((state) => ({
      completed: true,
      paused: true,
      summary,
      stats: summary
        ? {
            ...state.stats,
            averageIntensity: summary.averageIntensity,
            peakPhase: summary.peakPhase,
            safetyLevel: summary.safetyLevel
          }
        : state.stats
    }));
  },
  resetSession: () => {
    activeJourneySession = null;
    set(initialState);
  }
}));

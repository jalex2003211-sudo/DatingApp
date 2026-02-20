import { create } from 'zustand';
import { EmotionalJourneySession, JourneySnapshot, StartSessionResult } from '../application/session/EmotionalJourneySession';
import { DEFAULT_RELATIONSHIP_PROFILE } from '../domain/profile/RelationshipProfile';
import { SessionSummary } from '../domain/session/types';
import { getSessionQuestionsForMood } from '../engine/normalizeQuestions';
import { getThemeTokensByRole, RoleThemeTokens } from '../theme/roleTheme';
import { Mood, PartnerProfile, PlayerRole, Question, RelationshipStage, StageType } from '../types';
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
  relationshipStage: RelationshipStage | null;
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
  sessionQueue: string[];
  queueIndex: number;
  questionsShown: string[];
  currentPhase: StageType;
  targetIntensity: number;
  relationshipStage: RelationshipStage | null;
  partnerA: PartnerProfile;
  partnerB: PartnerProfile;
  activeSpeakerRole: PlayerRole;
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
  lastError: 'PREMIUM_REQUIRED' | 'INVALID_STATE' | 'MISSING_RELATIONSHIP_STAGE' | null;
  setRelationshipStage: (stage: RelationshipStage) => void;
  setPartnerProfiles: (profiles: { partnerA: PartnerProfile; partnerB: PartnerProfile }) => void;
  setActiveSpeakerRole: (role: PlayerRole) => void;
  getActiveThemeTokens: () => RoleThemeTokens;
  toggleActiveSpeakerRole: () => void;
  startSession: (mood: Mood, duration: number, overrideQuestions?: Question[]) => StartSessionResult;
  startFavoritesSession: (favoriteQuestions: Question[], duration?: number) => StartSessionResult;
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
  sessionQueue: [] as string[],
  queueIndex: 0,
  questionsShown: [] as string[],
  currentPhase: 'warmup' as StageType,
  targetIntensity: 2,
  relationshipStage: null,
  partnerA: { role: 'A', gender: 'NEUTRAL' } as PartnerProfile,
  partnerB: { role: 'B', gender: 'NEUTRAL' } as PartnerProfile,
  activeSpeakerRole: 'A' as PlayerRole,
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


const buildSessionQueue = (questions: Question[]): string[] => {
  const seen = new Set<string>();
  return questions
    .map((question) => question?.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
    .filter((id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
};

const getQueuePatch = (queue: string[], queueIndex: number) => ({
  queueIndex,
  currentQuestionId: queue[queueIndex] ?? null,
  nextQuestionId: queue[queueIndex + 1] ?? null,
  isDeckExhausted: queue.length === 0
});

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
  setRelationshipStage: (relationshipStage) => set({ relationshipStage }),
  setPartnerProfiles: ({ partnerA, partnerB }) => set({ partnerA, partnerB }),
  setActiveSpeakerRole: (activeSpeakerRole) => set({ activeSpeakerRole }),
  getActiveThemeTokens: () => {
    const { activeSpeakerRole, partnerA, partnerB } = get();
    return getThemeTokensByRole(activeSpeakerRole, partnerA, partnerB);
  },
  toggleActiveSpeakerRole: () =>
    set((state) => ({ activeSpeakerRole: state.activeSpeakerRole === 'A' ? 'B' : 'A' })),
  startSession: (mood, duration, overrideQuestions) => {
    const relationshipStage = get().relationshipStage;
    if (!relationshipStage) {
      const invalidStateResult: StartSessionResult = {
        ok: false,
        reason: 'INVALID_STATE',
        message: 'Relationship stage is required before starting a session.'
      };
      set({ lastError: 'MISSING_RELATIONSHIP_STAGE' });
      return invalidStateResult;
    }

    const questions = overrideQuestions && overrideQuestions.length > 0
      ? overrideQuestions
      : getSessionQuestionsForMood(mood, relationshipStage);
    activeJourneySession = new EmotionalJourneySession({
      mood,
      isPremium: get().isPremium,
      relationshipStage,
      relationshipProfile: {
        ...DEFAULT_RELATIONSHIP_PROFILE,
        stage: relationshipStage
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

    const sessionQueue = buildSessionQueue(questions);

    if (__DEV__) {
      console.assert(sessionQueue.length > 0, '[session] startSession created an empty queue');
      console.log('[session] queue initialized', { total: sessionQueue.length });
    }

    set({
      mood,
      duration,
      timerSecondsLeft: minutesToSeconds(duration),
      paused: false,
      completed: false,
      summary: null,
      sessionSummary: null,
      endReason: null,
      lastError: null,
      activeSpeakerRole: 'A',
      ...patchFromSnapshot(snapshot),
      sessionQueue,
      questionsShown: [],
      ...getQueuePatch(sessionQueue, 0)
    });

    return result;
  },
  startFavoritesSession: (favoriteQuestions, duration = 10) => {
    const relationshipStage = get().relationshipStage;
    if (!relationshipStage) {
      const invalidStateResult: StartSessionResult = {
        ok: false,
        reason: 'INVALID_STATE',
        message: 'Relationship stage is required before starting a session.'
      };
      set({ lastError: 'MISSING_RELATIONSHIP_STAGE' });
      return invalidStateResult;
    }

    if (!favoriteQuestions.length) {
      const invalidStateResult: StartSessionResult = {
        ok: false,
        reason: 'INVALID_STATE',
        message: 'Favorites session requires at least one question.'
      };
      set({ lastError: invalidStateResult.reason });
      return invalidStateResult;
    }

    return get().startSession('FUN', duration, favoriteQuestions);
  },
  nextCard: () => {
    const currentState = get();
    const { currentQuestionId, queueIndex, sessionQueue } = currentState;

    if (!currentQuestionId) {
      if (__DEV__) {
        console.warn('[session] nextCard skipped: missing currentQuestionId');
      }
      return;
    }

    const snapshot = activeJourneySession?.next();
    const journeyPatch = snapshot ? patchFromSnapshot(snapshot) : {};
    const shownQuestionIds = currentState.questionsShown.includes(currentQuestionId)
      ? currentState.questionsShown
      : [...currentState.questionsShown, currentQuestionId];

    const nextIndex = queueIndex + 1;
    const hasNextCard = nextIndex < sessionQueue.length;

    set((state) => ({
      ...journeyPatch,
      questionsShown: shownQuestionIds,
      sessionQueue,
      ...(hasNextCard ? getQueuePatch(sessionQueue, nextIndex) : {
        queueIndex,
        currentQuestionId: null,
        nextQuestionId: null,
        isDeckExhausted: true
      }),
      activeSpeakerRole: state.activeSpeakerRole === 'A' ? 'B' : 'A'
    }));

    if (!hasNextCard) {
      get().endSession({ reason: 'DECK_EXHAUSTED' });
    }
  },
  skipCard: () => {
    const currentState = get();
    const { currentQuestionId, queueIndex, sessionQueue } = currentState;

    if (!currentQuestionId) {
      if (__DEV__) {
        console.warn('[session] skipCard skipped: missing currentQuestionId');
      }
      return;
    }

    const snapshot = activeJourneySession?.skip();
    const journeyPatch = snapshot ? patchFromSnapshot(snapshot) : {};
    const shownQuestionIds = currentState.questionsShown.includes(currentQuestionId)
      ? currentState.questionsShown
      : [...currentState.questionsShown, currentQuestionId];

    const nextIndex = queueIndex + 1;
    const hasNextCard = nextIndex < sessionQueue.length;

    set((state) => ({
      ...journeyPatch,
      questionsShown: shownQuestionIds,
      sessionQueue,
      ...(hasNextCard ? getQueuePatch(sessionQueue, nextIndex) : {
        queueIndex,
        currentQuestionId: null,
        nextQuestionId: null,
        isDeckExhausted: true
      }),
      activeSpeakerRole: state.activeSpeakerRole === 'A' ? 'B' : 'A'
    }));

    if (!hasNextCard) {
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
    const patch = patchFromSnapshot(snapshot);
    set((state) => ({
      ...patch,
      currentQuestionId: state.currentQuestionId,
      nextQuestionId: state.nextQuestionId,
      questionsShown: state.questionsShown,
      sessionQueue: state.sessionQueue,
      queueIndex: state.queueIndex,
      isDeckExhausted: state.isDeckExhausted
    }));
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

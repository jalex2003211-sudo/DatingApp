import { EmotionalJourneyEngine } from '../../domain/session/EmotionalJourneyEngine';
import { EmotionalState, SessionMemory, SessionSummary } from '../../domain/session/types';
import { RelationshipProfile } from '../../domain/profile/RelationshipProfile';
import { EventBus } from '../../infrastructure/analytics/EventBus';
import { PremiumGate } from '../premium/PremiumGate';
import { SessionMemoryRepository } from '../../infrastructure/persistence/SessionMemoryRepository';
import { Mood, Question, RelationshipStage } from '../../types';

const DEFAULT_STAGE_SPEED: Record<RelationshipStage, number> = {
  new: 0.82,
  dating: 0.9,
  longTerm: 1,
  married: 0.98,
  reconnecting: 0.78
};

export type JourneySessionConfig = {
  mood: Mood;
  isPremium: boolean;
  relationshipProfile: RelationshipProfile;
  relationshipStage: RelationshipStage;
  questions: Question[];
};

export type JourneySnapshot = {
  emotionalState: EmotionalState;
  memory: SessionMemory;
  currentQuestion: Question | null;
  upcomingQuestion: Question | null;
  remainingQuestionsCount: number;
};

export type StartSessionResult =
  | { ok: true }
  | { ok: false; reason: 'PREMIUM_REQUIRED' | 'INVALID_STATE'; message?: string };

export class EmotionalJourneySession {
  private readonly engine: EmotionalJourneyEngine;
  private readonly premiumGate: PremiumGate;
  private readonly eventBus: EventBus;
  private readonly memoryRepository: SessionMemoryRepository;
  private readonly questions: Question[];

  private emotionalState: EmotionalState;
  private memory: SessionMemory;
  private currentQuestion: Question | null = null;
  private upcomingQuestion: Question | null = null;

  constructor(private readonly config: JourneySessionConfig) {
    this.engine = new EmotionalJourneyEngine(config.mood, config.relationshipProfile);
    this.premiumGate = new PremiumGate(config.isPremium);
    this.eventBus = new EventBus();
    this.memoryRepository = new SessionMemoryRepository();
    this.questions = this.premiumGate.filterQuestions(config.questions);
    this.emotionalState = this.engine.createInitialState();
    this.memory = this.engine.createMemory();
  }

  public start(): { result: StartSessionResult; snapshot: JourneySnapshot | null } {
    if (!this.premiumGate.canAccessMood(this.config.mood)) {
      return {
        result: {
          ok: false,
          reason: 'PREMIUM_REQUIRED',
          message: 'Selected mood requires premium access.'
        },
        snapshot: null
      };
    }

    this.eventBus.emit('session_started', { mood: this.config.mood });
    this.currentQuestion = this.pickQuestion();

    if (this.currentQuestion) {
      this.memory = this.engine.recordExposure(this.memory, this.currentQuestion);
      this.eventBus.emit('card_viewed', { questionId: this.currentQuestion.id });
      this.emotionalState = this.engine.advanceState(this.emotionalState, this.currentQuestion);
    }

    this.upcomingQuestion = this.pickQuestion();
    return {
      result: { ok: true },
      snapshot: this.getSnapshot()
    };
  }

  public next(): JourneySnapshot {
    if (this.upcomingQuestion) {
      this.currentQuestion = this.upcomingQuestion;
      this.memory = this.engine.recordExposure(this.memory, this.currentQuestion);
      this.eventBus.emit('card_viewed', { questionId: this.currentQuestion.id });
      const previousPhase = this.emotionalState.phase;
      this.emotionalState = this.engine.advanceState(this.emotionalState, this.currentQuestion);
      if (previousPhase !== this.emotionalState.phase) {
        this.eventBus.emit('phase_changed', { from: previousPhase, to: this.emotionalState.phase });
      }
    } else {
      this.currentQuestion = this.pickQuestion();
    }

    this.upcomingQuestion = this.pickQuestion();
    return this.getSnapshot();
  }

  public skip(): JourneySnapshot {
    this.memory = { ...this.memory, skipsCount: this.memory.skipsCount + 1 };
    this.emotionalState = this.engine.applySkipPenalty(this.emotionalState);
    this.eventBus.emit('card_skipped', { currentQuestionId: this.currentQuestion?.id ?? null });
    return this.next();
  }

  public favorite(): JourneySnapshot {
    this.memory = { ...this.memory, favoritesAdded: this.memory.favoritesAdded + 1 };
    this.emotionalState = this.engine.applyFavoriteReward(this.emotionalState);
    this.eventBus.emit('card_favorited', { questionId: this.currentQuestion?.id ?? null });
    return this.getSnapshot();
  }

  public complete(): SessionSummary {
    const summary = this.engine.buildSummary(this.memory, this.emotionalState);
    this.memoryRepository.saveSummary(summary);
    this.eventBus.emit('session_completed', summary);
    return summary;
  }

  public getSnapshot(): JourneySnapshot {
    return {
      emotionalState: this.emotionalState,
      memory: this.memory,
      currentQuestion: this.currentQuestion,
      upcomingQuestion: this.upcomingQuestion,
      remainingQuestionsCount: this.getRemainingQuestionsCount()
    };
  }

  public getLatestSummary(): SessionSummary | null {
    return this.memoryRepository.getLatestSummary();
  }


  private getRemainingQuestionsCount(): number {
    return this.questions.filter((question) => !this.memory.shownQuestionIds.includes(question.id)).length;
  }

  private pickQuestion(): Question | null {
    const stageSpeed = DEFAULT_STAGE_SPEED[this.config.relationshipStage];
    const maxIntensityAllowed = Math.max(
      1,
      Math.min(
        5,
        1 + this.config.relationshipProfile.vulnerabilityTolerance * 2.2 + this.config.relationshipProfile.intimacyComfort * 1.8
      )
    );

    return this.engine.selectQuestion({
      emotionalState: {
        ...this.emotionalState,
        intensity: this.emotionalState.intensity * stageSpeed
      },
      memory: this.memory,
      stageLimit: this.emotionalState.phase,
      maxIntensityAllowed,
      availableQuestions: this.questions.filter((question) => !this.memory.shownQuestionIds.includes(question.id))
    });
  }
}

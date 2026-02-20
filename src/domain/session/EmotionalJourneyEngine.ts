import { RelationshipProfile, normalizeRelationshipProfile } from '../profile/RelationshipProfile';
import { Mood, Question, StageType } from '../../types';
import { EmotionalState, QuestionSelectionContext, SessionMemory, SessionSummary } from './types';

const STAGE_ORDER: StageType[] = ['warmup', 'curiosity', 'deep', 'vulnerable', 'intimate', 'relief'];
const CLAMP_INTENSITY = (value: number) => Math.max(1, Math.min(5, value));

const STAGE_WEIGHT: Record<StageType, number> = {
  warmup: 0.7,
  curiosity: 1,
  deep: 1.2,
  vulnerable: 1.35,
  intimate: 1.45,
  relief: 0.8
};

export class EmotionalJourneyEngine {
  private readonly profile: RelationshipProfile;

  constructor(private readonly mood: Mood, profile: RelationshipProfile) {
    this.profile = normalizeRelationshipProfile(profile);
  }

  public createInitialState(): EmotionalState {
    const baseIntensity = this.profile.communicationStyle === 'light' ? 1.4 : this.profile.communicationStyle === 'intense' ? 2.4 : 1.9;
    return {
      phase: 'warmup',
      intensity: baseIntensity,
      momentum: 0.1,
      safetyLevel: 0.65
    };
  }

  public createMemory(): SessionMemory {
    return {
      shownQuestionIds: [],
      favoritesAdded: 0,
      skipsCount: 0,
      averageIntensityExperienced: 0,
      peakPhaseReached: 'warmup',
      intensitySamples: []
    };
  }

  public applySkipPenalty(state: EmotionalState): EmotionalState {
    return {
      ...state,
      safetyLevel: Math.max(0.2, state.safetyLevel - 0.08),
      momentum: Math.max(-1, state.momentum - 0.15)
    };
  }

  public applyFavoriteReward(state: EmotionalState): EmotionalState {
    return {
      ...state,
      safetyLevel: Math.min(1, state.safetyLevel + 0.06),
      momentum: Math.min(1, state.momentum + 0.12)
    };
  }

  public advanceState(state: EmotionalState, askedQuestion: Question): EmotionalState {
    const questionIntensity = askedQuestion.intensity ?? 2;
    const target = this.dynamicTargetIntensity(state);
    const drift = (target - state.intensity) * 0.35;
    const momentumShift = (questionIntensity - state.intensity) * 0.12;

    const reliefBoost = state.safetyLevel < 0.45 ? 0.45 : state.safetyLevel < 0.6 ? 0.25 : 0;
    const reliefPressure = askedQuestion.stageType === 'relief' ? -0.25 : 0.12;

    const nextIntensity = CLAMP_INTENSITY(state.intensity + drift + momentumShift + reliefPressure - reliefBoost);
    const nextPhase = this.pickPhase(nextIntensity, state.safetyLevel);

    return {
      phase: nextPhase,
      intensity: nextIntensity,
      momentum: Math.max(-1, Math.min(1, state.momentum + momentumShift)),
      safetyLevel: state.safetyLevel
    };
  }

  public selectQuestion(context: QuestionSelectionContext): Question | null {
    if (!context.availableQuestions.length) return null;

    const candidates = context.availableQuestions.filter((question) => {
      const intensity = question.intensity ?? context.emotionalState.intensity;
      return intensity <= context.maxIntensityAllowed;
    });

    if (!candidates.length) return null;

    const scored = candidates.map((question) => {
      const score = this.calculateScore(question, context);
      return { question, score };
    });

    return this.pickSoftmax(scored, 0.85);
  }

  public buildSummary(memory: SessionMemory, finalState: EmotionalState): SessionSummary {
    const avg = memory.intensitySamples.length
      ? memory.intensitySamples.reduce((sum, value) => sum + value, 0) / memory.intensitySamples.length
      : finalState.intensity;

    const reflectionMessage = this.generateReflection(memory, finalState, avg);

    return {
      totalCards: memory.shownQuestionIds.length,
      peakPhase: memory.peakPhaseReached,
      averageIntensity: Number(avg.toFixed(2)),
      safetyLevel: Number(finalState.safetyLevel.toFixed(2)),
      reflectionMessage
    };
  }

  public recordExposure(memory: SessionMemory, question: Question): SessionMemory {
    const intensity = question.intensity ?? 2;
    const samples = [...memory.intensitySamples, intensity];
    const peak = this.getPeakPhase(memory.peakPhaseReached, question.stageType ?? 'warmup');

    return {
      ...memory,
      shownQuestionIds: [...memory.shownQuestionIds, question.id],
      intensitySamples: samples,
      averageIntensityExperienced: samples.reduce((sum, v) => sum + v, 0) / samples.length,
      peakPhaseReached: peak
    };
  }

  private calculateScore(question: Question, context: QuestionSelectionContext): number {
    const questionStage = question.stageType ?? 'warmup';
    const intensity = question.intensity ?? 2;

    const stageMatchWeight = questionStage === context.emotionalState.phase ? 2.2 : 0.9 * STAGE_WEIGHT[questionStage];
    const intensityProximityWeight = 2 - Math.min(2, Math.abs(context.emotionalState.intensity - intensity));
    const noveltyWeight = context.memory.shownQuestionIds.includes(question.id) ? -3 : 1.4;
    const safetyCompatibilityWeight = context.emotionalState.safetyLevel >= intensity / 5 ? 1.2 : -1.6;
    const randomnessNoise = (Math.random() - 0.5) * 0.35;

    return (
      stageMatchWeight +
      intensityProximityWeight +
      noveltyWeight +
      safetyCompatibilityWeight +
      randomnessNoise +
      (question.weight ?? 0)
    );
  }

  private pickSoftmax(scored: Array<{ question: Question; score: number }>, temperature: number): Question {
    const exps = scored.map((item) => Math.exp(item.score / temperature));
    const sum = exps.reduce((acc, value) => acc + value, 0);
    let random = Math.random() * sum;

    for (let i = 0; i < scored.length; i += 1) {
      random -= exps[i];
      if (random <= 0) {
        return scored[i].question;
      }
    }

    return scored[scored.length - 1].question;
  }

  private dynamicTargetIntensity(state: EmotionalState): number {
    const moodCap = this.mood === 'FUN' ? 2.5 : this.mood === 'DEEP' ? 4.2 : 4.6;
    const profileCap = 2 + this.profile.vulnerabilityTolerance * 2 + this.profile.intimacyComfort;
    return CLAMP_INTENSITY(Math.min(moodCap, profileCap) + state.momentum * 0.5);
  }

  private pickPhase(intensity: number, safetyLevel: number): StageType {
    if (safetyLevel < 0.42) return 'relief';
    if (intensity < 1.9) return 'warmup';
    if (intensity < 2.5) return 'curiosity';
    if (intensity < 3.25) return 'deep';
    if (intensity < 3.9) return 'vulnerable';
    return 'intimate';
  }

  private getPeakPhase(currentPeak: StageType, candidate: StageType): StageType {
    return STAGE_ORDER.indexOf(candidate) > STAGE_ORDER.indexOf(currentPeak) ? candidate : currentPeak;
  }

  private generateReflection(memory: SessionMemory, finalState: EmotionalState, avgIntensity: number): string {
    if (memory.skipsCount > memory.shownQuestionIds.length * 0.35 || finalState.safetyLevel < 0.45) {
      return 'You honored your limits and still stayed connected. That is emotional maturity.';
    }
    if (memory.favoritesAdded >= 3 && avgIntensity >= 3) {
      return 'You both leaned in with courage and curiosity. This is how deeper trust is built.';
    }
    return 'You kept a steady emotional rhythm and created meaningful space for each other.';
  }
}

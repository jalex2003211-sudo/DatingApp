import { Mood, Question, RelationshipStage, StageType } from '../types';

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

type EngineConfig = {
  mood: Mood | 'mixed';
  relationshipStage: RelationshipStage;
  isPremium: boolean;
};

type EngineState = {
  currentPhase: StageType;
  targetIntensity: number;
  questionsShown: string[];
};

export class SessionEngine {
  constructor(
    private readonly questions: Question[],
    private readonly config: EngineConfig
  ) {}

  public getNextQuestion(state: EngineState): Question | null {
    const pool = this.buildCandidatePool(state);
    if (pool.length === 0) {
      return null;
    }

    return this.weightedRandom(pool, state);
  }

  private buildCandidatePool(state: EngineState): Question[] {
    const target = clamp(state.targetIntensity, 1, 5);

    return this.questions.filter((question) => {
      if (!this.config.isPremium && question.premium) {
        return false;
      }

      if (!question.relationshipSuitability?.includes(this.config.relationshipStage)) {
        return false;
      }

      if (state.questionsShown.includes(question.id)) {
        return false;
      }

      if (this.config.mood !== 'mixed' && question.mood !== this.config.mood) {
        return false;
      }

      if (Math.abs((question.intensity ?? target) - target) > 1) {
        return false;
      }

      return true;
    });
  }

  private weightedRandom(pool: Question[], state: EngineState): Question {
    const scored = pool.map((question) => ({
      question,
      weight: this.calculateWeight(question, state)
    }));

    const totalWeight = scored.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of scored) {
      if (random <= item.weight) {
        return item.question;
      }
      random -= item.weight;
    }

    return scored[scored.length - 1].question;
  }

  private calculateWeight(question: Question, state: EngineState): number {
    const target = clamp(state.targetIntensity, 1, 5);
    const intensity = question.intensity ?? target;

    let score = 1;

    if (question.stageType === state.currentPhase) {
      score += 4;
    }

    score += Math.max(0, 2 - Math.abs(intensity - target));
    score += question.weight ?? 0;

    return Math.max(score, 1);
  }
}

export type { EngineConfig, EngineState };

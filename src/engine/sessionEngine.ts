import { Question } from "../types/question";
import { SessionConfig, SessionState } from "../types/session";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export class SessionEngine {
  constructor(
    private questions: Question[],
    private config: SessionConfig
  ) {}

  public getNextQuestion(state: SessionState): Question | null {
    const pool = this.buildCandidatePool(state);
    if (pool.length === 0) return null;

    return this.weightedRandom(pool, state);
  }

  private buildCandidatePool(state: SessionState): Question[] {
    const target = clamp(state.targetIntensity ?? 3, 1, 5);

    return this.questions.filter((q) => {
      // premium gate
      if (!this.config.isPremium && q.premium) return false;

      // relationship stage gate
      if (!q.relationshipSuitability.includes(this.config.relationshipStage)) return false;

      // already shown
      if (state.questionsShown.includes(q.id)) return false;

      // mood gate (αν mood είναι mixed, δέχεται όλα)
      if (this.config.mood !== "mixed" && q.mood !== this.config.mood) return false;

      // intensity window (±1)
      if (Math.abs(q.intensity - target) > 1) return false;

      return true;
    });
  }

  private weightedRandom(pool: Question[], state: SessionState): Question {
    const scored = pool.map((q) => ({
      question: q,
      score: this.calculateScore(q, state),
    }));

    const total = scored.reduce((sum, item) => sum + item.score, 0);
    let r = Math.random() * total;

    for (const item of scored) {
      if (r < item.score) return item.question;
      r -= item.score;
    }

    // fallback
    return scored[0].question;
  }

  private calculateScore(q: Question, state: SessionState): number {
    const target = clamp(state.targetIntensity ?? 3, 1, 5);

    let score = 10;

    // prefer current phase
    if (q.stageType === state.currentPhase) score += 4;

    // prefer closer intensity
    score += 3 - Math.abs(q.intensity - target); // 2..3..1

    // small “turn rhythm” boost (optional, harmless)
    // π.χ. αν είναι "user" turn, δώσε λίγο boost σε warmup/curiosity
    if (state.partnerTurn === "user" && (q.stageType === "warmup" || q.stageType === "curiosity")) {
      score += 1;
    }
    if (state.partnerTurn === "partner" && (q.stageType === "deep" || q.stageType === "vulnerable" || q.stageType === "intimate")) {
      score += 1;
    }

    // optional custom weight
    if (typeof q.weight === "number") score += q.weight;

    return Math.max(score, 1);
  }
}
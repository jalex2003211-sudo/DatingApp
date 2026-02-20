import { Mood, Question } from '../../types';

export type PremiumFeatureFlags = {
  allowIntimateMood: boolean;
  allowHighIntensity: boolean;
};

const DEFAULT_FLAGS: PremiumFeatureFlags = {
  allowIntimateMood: false,
  allowHighIntensity: false
};

export class PremiumGate {
  constructor(private readonly isPremium: boolean, private readonly flags: PremiumFeatureFlags = DEFAULT_FLAGS) {}

  public canAccessMood(mood: Mood): boolean {
    if (mood !== 'INTIMATE') return true;
    return this.isPremium || this.flags.allowIntimateMood;
  }

  public filterQuestions(questions: Question[]): Question[] {
    if (this.isPremium) return questions;

    return questions.filter((question) => {
      const overIntensityLimit = (question.intensity ?? 1) > 3;
      if (overIntensityLimit && !this.flags.allowHighIntensity) {
        return false;
      }
      if (question.mood === 'INTIMATE' && !this.flags.allowIntimateMood) {
        return false;
      }
      return !question.premium;
    });
  }
}

export interface AdaptiveProfile {
  preferredMoods: Record<string, number>; 
  intensityTolerance: number; // dynamic 1–5 baseline

  skipRateByIntensity: Record<number, number>;

  favoritesByStage: Record<string, number>;

  sessionsCompleted: number;
}
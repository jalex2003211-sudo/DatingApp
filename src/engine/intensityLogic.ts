import { Mood, StageType } from '../types/question';

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function computeTargetIntensity(
  mood: Mood,
  progress: number,
  tolerance: number,
  stressSignal: number,
  phase: StageType
): number {
  const baseCap = mood === 'light' ? 2 : 4;
  const progressBoost = clamp(progress, 0, 1) * (baseCap - 1);
  const toleranceBoost = clamp(tolerance, 1, 5) >= 4 ? 1 : 0;
  const stressPenalty = stressSignal > 0 ? 1 : 0;
  const phasePenalty = phase === 'relief' ? 1 : 0;

  return clamp(Math.round(1 + progressBoost + toleranceBoost - stressPenalty - phasePenalty), 1, 5);
}

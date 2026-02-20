import { Mood, StageType } from "../types/question";

export function computeTargetIntensity(
  mood: Mood,
  progress: number,
  tolerance: number,
  stressSignal: number,
  phase: StageType
): number {
  ...
}
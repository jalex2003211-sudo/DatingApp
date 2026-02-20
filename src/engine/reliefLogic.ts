import { StageType } from "../types/question";

export function computeReliefNeeded(
  lastStageTypes: StageType[],
  recentSkips: number,
  avgIntensityLast2: number,
  progress: number
): boolean {
  ...
}
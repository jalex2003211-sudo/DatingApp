import { StageType } from '../types/question';

export function computeReliefNeeded(
  lastStageTypes: StageType[],
  recentSkips: number,
  avgIntensityLast2: number,
  progress: number
): boolean {
  const intenseRecent = lastStageTypes.slice(-2).some((stage) => stage === 'deep' || stage === 'vulnerable' || stage === 'intimate');
  const skipSignal = recentSkips >= 2;
  const intensitySignal = avgIntensityLast2 >= 4;
  const lateSession = progress > 0.75;

  return skipSignal || intensitySignal || (intenseRecent && lateSession);
}

import { Mood, StageType } from '../types/question';

const STAGE_FLOW: Record<Mood, StageType[]> = {
  light: ['warmup', 'curiosity', 'relief'],
  deep: ['warmup', 'curiosity', 'deep', 'relief', 'vulnerable', 'relief'],
  passion: ['warmup', 'curiosity', 'intimate', 'relief'],
  mixed: ['warmup', 'curiosity', 'deep', 'intimate', 'relief']
};

export function phaseForProgress(mood: Mood, progress: number): StageType {
  const flow = STAGE_FLOW[mood];
  const boundedProgress = Math.max(0, Math.min(1, progress));
  const idx = Math.min(flow.length - 1, Math.floor(boundedProgress * flow.length));
  return flow[idx];
}

import { decksByMood } from '../data/decks';
import { Mood, Question, RelationshipStage, StageType } from '../types';

const DEFAULT_RELATIONSHIP_SUITABILITY: RelationshipStage[] = [
  'new',
  'dating',
  'longTerm',
  'married',
  'reconnecting'
];

const STAGE_SEQUENCES: Record<Mood, StageType[]> = {
  FUN: ['warmup', 'curiosity', 'relief'],
  DEEP: ['warmup', 'curiosity', 'deep', 'relief', 'vulnerable', 'relief'],
  INTIMATE: ['warmup', 'curiosity', 'intimate', 'relief']
};

const INTENSITY_CAP_BY_MOOD: Record<Mood, 2 | 4> = {
  FUN: 2,
  DEEP: 4,
  INTIMATE: 4
};

const stageFromProgress = (mood: Mood, index: number, total: number): StageType => {
  const sequence = STAGE_SEQUENCES[mood];
  const bucketSize = Math.max(1, Math.ceil(total / sequence.length));
  const sequenceIndex = Math.min(sequence.length - 1, Math.floor(index / bucketSize));
  return sequence[sequenceIndex];
};

const intensityFromProgress = (mood: Mood, index: number, total: number): 1 | 2 | 3 | 4 | 5 => {
  const cap = INTENSITY_CAP_BY_MOOD[mood];
  if (total <= 1) return 1;

  const ratio = index / (total - 1);
  const raw = 1 + Math.round(ratio * (cap - 1));
  const bounded = Math.max(1, Math.min(cap, raw));

  return bounded as 1 | 2 | 3 | 4 | 5;
};

const normalizeDeck = (mood: Mood): Question[] => {
  const deck = decksByMood[mood] ?? [];
  if (!deck.length) return [];

  return deck.map((question, index) => ({
    ...question,
    relationshipSuitability: question.relationshipSuitability ?? DEFAULT_RELATIONSHIP_SUITABILITY,
    stageType: question.stageType ?? stageFromProgress(mood, index, deck.length),
    intensity: question.intensity ?? intensityFromProgress(mood, index, deck.length),
    premium: question.premium ?? mood === 'INTIMATE',
    weight: question.weight ?? 0
  }));
};

export const getNormalizedQuestionsForMood = (mood: Mood): Question[] => normalizeDeck(mood);

export const getAllNormalizedQuestions = (): Question[] =>
  (Object.keys(decksByMood) as Mood[]).flatMap((mood) => normalizeDeck(mood));

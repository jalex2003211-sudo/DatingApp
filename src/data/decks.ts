import type { MoodKey, PromptCard } from '../types';

const promptsByMood: Record<MoodKey, PromptCard[]> = {
  romantic: [
    { id: 'r1', mood: 'romantic', textKey: 'cards.romantic.r1' },
    { id: 'r2', mood: 'romantic', textKey: 'cards.romantic.r2' },
    { id: 'r3', mood: 'romantic', textKey: 'cards.romantic.r3' },
    { id: 'r4', mood: 'romantic', textKey: 'cards.romantic.r4' },
    { id: 'r5', mood: 'romantic', textKey: 'cards.romantic.r5' },
    { id: 'r6', mood: 'romantic', textKey: 'cards.romantic.r6' },
  ],
  funny: [
    { id: 'f1', mood: 'funny', textKey: 'cards.funny.f1' },
    { id: 'f2', mood: 'funny', textKey: 'cards.funny.f2' },
    { id: 'f3', mood: 'funny', textKey: 'cards.funny.f3' },
    { id: 'f4', mood: 'funny', textKey: 'cards.funny.f4' },
    { id: 'f5', mood: 'funny', textKey: 'cards.funny.f5' },
    { id: 'f6', mood: 'funny', textKey: 'cards.funny.f6' },
  ],
  deep: [
    { id: 'd1', mood: 'deep', textKey: 'cards.deep.d1' },
    { id: 'd2', mood: 'deep', textKey: 'cards.deep.d2' },
    { id: 'd3', mood: 'deep', textKey: 'cards.deep.d3' },
    { id: 'd4', mood: 'deep', textKey: 'cards.deep.d4' },
    { id: 'd5', mood: 'deep', textKey: 'cards.deep.d5' },
    { id: 'd6', mood: 'deep', textKey: 'cards.deep.d6' },
  ],
  spicy: [
    { id: 's1', mood: 'spicy', textKey: 'cards.spicy.s1' },
    { id: 's2', mood: 'spicy', textKey: 'cards.spicy.s2' },
    { id: 's3', mood: 'spicy', textKey: 'cards.spicy.s3' },
    { id: 's4', mood: 'spicy', textKey: 'cards.spicy.s4' },
    { id: 's5', mood: 'spicy', textKey: 'cards.spicy.s5' },
    { id: 's6', mood: 'spicy', textKey: 'cards.spicy.s6' },
  ],
};

export function getDeckForMood(mood: MoodKey): PromptCard[] {
  return promptsByMood[mood];
}

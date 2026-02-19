export type MoodKey = 'romantic' | 'funny' | 'deep' | 'spicy';

export type DurationKey = 'short' | 'medium' | 'long';

export type PlayerSide = 'you' | 'partner';

export interface PromptCard {
  id: string;
  mood: MoodKey;
  textKey: string;
}

export interface SessionStats {
  totalCards: number;
  answeredCards: number;
  favoritesAdded: number;
  elapsedSeconds: number;
}

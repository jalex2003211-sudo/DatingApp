export type Mood = "light" | "deep" | "passion" | "mixed";

export type StageType =
  | "warmup"
  | "curiosity"
  | "deep"
  | "vulnerable"
  | "intimate"
  | "relief";

export type RelationshipStage =
  | "new"
  | "dating"
  | "longTerm"
  | "married"
  | "reconnecting";

export interface Question {
  id: string;

  text: {
    en: string;
    el: string;
  };

  mood: Mood;

  intensity: 1 | 2 | 3 | 4 | 5;

  stageType: StageType;

  relationshipSuitability?: RelationshipStage[];

  premium: boolean;

  weight?: number; // optional for adaptive weighting
}
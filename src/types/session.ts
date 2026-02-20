import { Mood, RelationshipStage, StageType } from "./question";

export interface SessionConfig {
  mood: Mood;
  relationshipStage: RelationshipStage;
  durationMinutes: number;
  isPremium: boolean;
}

export interface SessionState {
  currentPhase: StageType;
  targetIntensity: number;
  questionsShown: string[];
  partnerTurn: "user" | "partner";
  questionsAnswered: number;
}
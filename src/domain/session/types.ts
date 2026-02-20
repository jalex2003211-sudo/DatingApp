import { Question, StageType } from '../../types';

export type EmotionalState = {
  phase: StageType;
  intensity: number;
  momentum: number;
  safetyLevel: number;
};

export type SessionMemory = {
  shownQuestionIds: string[];
  favoritesAdded: number;
  skipsCount: number;
  averageIntensityExperienced: number;
  peakPhaseReached: StageType;
  intensitySamples: number[];
};

export type SessionSummary = {
  totalCards: number;
  peakPhase: StageType;
  averageIntensity: number;
  safetyLevel: number;
  reflectionMessage: string;
};

export type QuestionSelectionContext = {
  emotionalState: EmotionalState;
  memory: SessionMemory;
  stageLimit: StageType;
  maxIntensityAllowed: number;
  availableQuestions: Question[];
};

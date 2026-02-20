export type Mood = 'FUN' | 'DEEP' | 'INTIMATE';

export type StageType =
  | 'warmup'
  | 'curiosity'
  | 'deep'
  | 'vulnerable'
  | 'intimate'
  | 'relief';

export type RelationshipStage =
  | 'new'
  | 'dating'
  | 'longTerm'
  | 'married'
  | 'reconnecting';

export type Gender = 'MALE' | 'FEMALE' | 'NEUTRAL';

export type PlayerRole = 'A' | 'B';

export type PartnerProfile = {
  role: PlayerRole;
  gender: Gender;
  displayName?: string;
};

export type Intensity = 1 | 2 | 3 | 4 | 5;

export type Question = {
  id: string;
  mood: Mood;
  text: { el: string; en: string };

  // ✅ engine-ready (optional για τώρα)
  intensity?: Intensity;
  stageType?: StageType;
  relationshipSuitability?: RelationshipStage[];
  premium?: boolean;
  weight?: number;

  // optional future: hints per card
  hint?: { el: string; en: string };
};

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  ChooseRelationshipStage: undefined;
  ChooseRoles: undefined;
  ChooseMood: undefined;
  ChooseDuration: { mood: Mood };
  Game: undefined;
  End: { reason?: 'TIME_UP' | 'DECK_EXHAUSTED' | 'USER_ENDED' } | undefined;
  Favorites: undefined;
  Premium: undefined;
  Settings: undefined;
  ProfileSetup: undefined;
};

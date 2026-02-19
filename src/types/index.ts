export type Mood = 'FUN' | 'DEEP' | 'INTIMATE';

export type Question = {
  id: string;
  mood: Mood;
  text: {
    el: string;
    en: string;
  };
};

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  ChooseMood: undefined;
  ChooseDuration: { mood: Mood };
  Game: undefined;
  End: undefined;
  Favorites: undefined;
  Settings: undefined;
};

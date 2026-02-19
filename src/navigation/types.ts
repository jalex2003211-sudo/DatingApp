import type { DurationKey, MoodKey, SessionStats } from '../types';

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  ChooseMood: undefined;
  ChooseDuration: { mood: MoodKey };
  Game: { mood: MoodKey; duration: DurationKey };
  End: { stats: SessionStats };
  Favorites: undefined;
  Settings: undefined;
};

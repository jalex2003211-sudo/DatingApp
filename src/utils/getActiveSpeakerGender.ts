import { FavoriteLikedBy } from '../state/favoritesStore';
import { PlayerRole } from '../types';

export const getActiveSpeakerGender = (activeSpeakerRole: PlayerRole): FavoriteLikedBy =>
  activeSpeakerRole === 'A' ? 'A' : 'B';

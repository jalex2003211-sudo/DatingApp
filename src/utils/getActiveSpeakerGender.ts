import { FavoriteLikedBy } from '../state/favoritesStore';
import { Gender, PartnerProfile, PlayerRole } from '../types';

const mapGenderToLikedBy = (gender: Gender): FavoriteLikedBy => {
  if (gender === 'MALE') return 'male';
  if (gender === 'FEMALE') return 'female';
  return 'neutral';
};

export const getActiveSpeakerGender = (
  activeSpeakerRole: PlayerRole,
  partnerA: PartnerProfile,
  partnerB: PartnerProfile
): FavoriteLikedBy => {
  const speakerGender = activeSpeakerRole === 'A' ? partnerA.gender : partnerB.gender;
  return mapGenderToLikedBy(speakerGender);
};

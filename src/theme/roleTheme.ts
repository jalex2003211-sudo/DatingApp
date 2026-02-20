import { Gender, PartnerProfile, PlayerRole } from '../types';

export type RoleThemeTokens = {
  accent: string;
  heart: string;
  chipBg: string;
  borderGlow: string;
};

const themeTokens: Record<'male' | 'female' | 'neutral', RoleThemeTokens> = {
  male: {
    accent: '#93C5FD',
    heart: '#60A5FA',
    chipBg: 'rgba(147,197,253,0.14)',
    borderGlow: 'rgba(147,197,253,0.30)'
  },
  female: {
    accent: '#FBCFE8',
    heart: '#F472B6',
    chipBg: 'rgba(251,207,232,0.14)',
    borderGlow: 'rgba(244,114,182,0.30)'
  },
  neutral: {
    accent: '#C7D2FE',
    heart: '#A5B4FC',
    chipBg: 'rgba(199,210,254,0.14)',
    borderGlow: 'rgba(165,180,252,0.30)'
  }
};

export const getThemeTokensByGender = (gender: Gender): RoleThemeTokens => {
  if (gender === 'MALE') return themeTokens.male;
  if (gender === 'FEMALE') return themeTokens.female;
  return themeTokens.neutral;
};

export const getThemeTokensByRole = (
  activeSpeakerRole: PlayerRole,
  partnerA: PartnerProfile,
  partnerB: PartnerProfile
): RoleThemeTokens => {
  const activePartner = activeSpeakerRole === 'A' ? partnerA : partnerB;
  return getThemeTokensByGender(activePartner.gender);
};

import { PartnerProfile } from '../types/profile';

const accentPalette = {
  blue: '#60A5FA',
  pink: '#F472B6',
  purple: '#A78BFA',
  teal: '#2DD4BF'
} as const;

export const getAccentForPartner = (profile: PartnerProfile): string => {
  if (profile.accent && profile.accent !== 'auto') {
    return accentPalette[profile.accent];
  }

  if (profile.gender === 'male') return accentPalette.blue;
  if (profile.gender === 'female') return accentPalette.pink;
  return accentPalette.purple;
};

export const buildAccentTokens = (accent: string) => ({
  accent,
  heart: accent,
  chipBg: `${accent}26`,
  borderGlow: `${accent}4D`
});

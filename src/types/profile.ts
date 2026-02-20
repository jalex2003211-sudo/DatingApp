export type Gender = 'male' | 'female' | 'custom';

export type PartnerProfile = {
  id: 'A' | 'B';
  name: string;
  gender: Gender;
  accent?: 'auto' | 'blue' | 'pink' | 'purple' | 'teal';
  photoUri?: string | null;
};

export type UserProfile = {
  partnerA: PartnerProfile;
  partnerB: PartnerProfile;
  updatedAt: number;
};

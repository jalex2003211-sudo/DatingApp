import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { PartnerProfile, UserProfile } from '../types/profile';

const PROFILE_STORAGE_KEY = 'profile.v1';

const createDefaultPartner = (id: 'A' | 'B'): PartnerProfile => ({
  id,
  name: id === 'A' ? 'Partner A' : 'Partner B',
  gender: 'custom',
  accent: 'auto',
  photoUri: null
});

export const createDefaultProfile = (): UserProfile => ({
  partnerA: createDefaultPartner('A'),
  partnerB: createDefaultPartner('B'),
  updatedAt: Date.now()
});

type ProfileState = {
  profile: UserProfile | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  save: (profile: UserProfile) => Promise<void>;
  updatePartner: (id: 'A' | 'B', partial: Partial<PartnerProfile>) => Promise<void>;
  reset: () => Promise<void>;
};

const normalizeProfile = (raw: unknown): UserProfile | null => {
  if (!raw || typeof raw !== 'object') return null;
  const maybe = raw as Partial<UserProfile>;

  if (!maybe.partnerA || !maybe.partnerB) return null;

  return {
    partnerA: {
      ...createDefaultPartner('A'),
      ...maybe.partnerA,
      id: 'A'
    },
    partnerB: {
      ...createDefaultPartner('B'),
      ...maybe.partnerB,
      id: 'B'
    },
    updatedAt: typeof maybe.updatedAt === 'number' ? maybe.updatedAt : Date.now()
  };
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  hydrated: false,
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      const parsed = raw ? normalizeProfile(JSON.parse(raw)) : null;
      set({ profile: parsed, hydrated: true });
    } catch {
      set({ profile: null, hydrated: true });
    }
  },
  save: async (profile) => {
    const next: UserProfile = { ...profile, updatedAt: Date.now() };
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
    set({ profile: next });
  },
  updatePartner: async (id, partial) => {
    const current = get().profile ?? createDefaultProfile();
    const key = id === 'A' ? 'partnerA' : 'partnerB';
    const next: UserProfile = {
      ...current,
      [key]: { ...current[key], ...partial, id },
      updatedAt: Date.now()
    };
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
    set({ profile: next });
  },
  reset: async () => {
    await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
    set({ profile: null });
  }
}));

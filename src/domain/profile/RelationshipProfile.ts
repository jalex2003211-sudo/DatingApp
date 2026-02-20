export type RelationshipProfile = {
  stage: 'new' | 'dating' | 'longTerm' | 'married' | 'reconnecting';
  communicationStyle: 'light' | 'balanced' | 'intense';
  vulnerabilityTolerance: number;
  intimacyComfort: number;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export const normalizeRelationshipProfile = (profile: RelationshipProfile): RelationshipProfile => ({
  ...profile,
  vulnerabilityTolerance: clamp01(profile.vulnerabilityTolerance),
  intimacyComfort: clamp01(profile.intimacyComfort)
});

export const DEFAULT_RELATIONSHIP_PROFILE: RelationshipProfile = {
  stage: 'longTerm',
  communicationStyle: 'balanced',
  vulnerabilityTolerance: 0.6,
  intimacyComfort: 0.6
};

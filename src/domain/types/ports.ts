export type IdentityService = {
  createUniqueId(): string;
};

export type SeedingService = {
  createRandomizer(seed: number): () => number;
  createSeed(): number;
};

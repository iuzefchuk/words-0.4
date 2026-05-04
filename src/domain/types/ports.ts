export type IdentifierService = {
  createUniqueId(): string;
};

export type RandomizerService = {
  createRandomizer(seed: number): () => number;
  createSeed(): number;
};

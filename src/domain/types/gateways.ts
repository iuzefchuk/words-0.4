export type GameGateways = {
  identifier: GameIdentifierGateway;
  randomizer: GameRandomizerGateway;
};

export type GameIdentifierGateway = {
  create(): string;
};

export type GameRandomizerGateway = {
  createFunctionFromSeed(seed: number): () => number;
  createNewSeed(): number;
};

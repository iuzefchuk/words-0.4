export enum InventoryLetter {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  F = 'F',
  G = 'G',
  H = 'H',
  I = 'I',
  J = 'J',
  K = 'K',
  L = 'L',
  M = 'M',
  N = 'N',
  O = 'O',
  P = 'P',
  Q = 'Q',
  R = 'R',
  S = 'S',
  T = 'T',
  U = 'U',
  V = 'V',
  W = 'W',
  X = 'X',
  Y = 'Y',
  Z = 'Z',
}

export enum InventoryStockStage {
  Owned = 'Owned',
  Unused = 'Unused',
  Used = 'Used',
}

export enum MatchDifficulty {
  High = 'High',
  Low = 'Low',
  Medium = 'Medium',
}

export enum MatchPlayer {
  Opponent = 'Opponent',
  User = 'User',
}

export enum MatchResult {
  Lose = 'Lose',
  Tie = 'Tie',
  Undecided = 'Undecided',
  Win = 'Win',
}

export enum MatchType {
  Classic = 'Classic',
  Random = 'Random',
}

export enum PlayfieldAxis {
  X = 'X',
  Y = 'Y',
}

export enum PlayfieldBonus {
  DoubleLetter = 'DoubleLetter',
  DoubleWord = 'DoubleWord',
  TripleLetter = 'TripleLetter',
  TripleWord = 'TripleWord',
}

export enum PlayfieldType {
  Preset = 'Preset',
  Random = 'Random',
}

export enum TurnGenerationCommandType {
  ContinueExecute = 'ContinueExecute',
  ReturnResult = 'ReturnResult',
  StopExecute = 'StopExecute',
}

export enum TurnGenerationDirection {
  Left = -1,
  Right = 1,
}

export enum TurnGenerationTask {
  ApplyResolution = 'ApplyResolution',
  CalculateCandidate = 'CalculateCandidate',
  EvaluateTraversal = 'EvaluateTraversal',
  ResolveCandidate = 'ResolveCandidate',
  ReverseResolution = 'ReverseResolution',
  ValidateTraversal = 'ValidateTraversal',
}

export enum TurnStatus {
  Current = 'Current',
  Passed = 'Passed',
  Saved = 'Saved',
}

export enum TurnValidationError {
  InvalidCellPlacement = 'InvalidCellPlacement',
  InvalidTilePlacement = 'InvalidTilePlacement',
  NoCellsUsableAsFirst = 'NoCellsUsableAsFirst',
  WordNotInDictionary = 'WordNotInDictionary',
}

export enum TurnValidity {
  Invalid = 'Invalid',
  Unknown = 'Unknown',
  Valid = 'Valid',
}

export enum PlayerMove {
  StartedGame = 'StartedGame',
  PlayedBySave = 'PlayedBySave',
  PlayedByPass = 'PlayedByPass',
  Won = 'Won',
  Tied = 'Tied',
}

export enum ValidationResultType {
  Unvalidated = 'Unvalidated',
  Invalid = 'Invalid',
  Valid = 'Valid',
}

export enum ValidationErrors {
  InvalidTilePlacement = 'error_tile_1',
  InvalidCellPlacement = 'error_cell_2',
  NoCellsUsableAsFirst = 'error_cell_3',
  WordNotInDictionary = 'error_tile_4',
}

export enum SearchPhase {
  Explore = 'Explore',
  ValidateBounds = 'ValidateBounds',
  CalculateTarget = 'CalculateTarget',
  ResolveTarget = 'ResolveTarget',
  IterativelyResolveTarget = 'IterativelyResolveTarget',
  UndoResolveTarget = 'UndoResolveTarget',
}

export enum Direction {
  Left = -1,
  Right = 1,
}

export enum TransitionResultType {
  Continue = 'Continue',
  Success = 'Success',
  Fail = 'Fail',
}

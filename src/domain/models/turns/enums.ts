export enum ValidationError {
  InvalidCellPlacement = 'InvalidCellPlacement',
  InvalidTilePlacement = 'InvalidTilePlacement',
  NoCellsUsableAsFirst = 'NoCellsUsableAsFirst',
  WordNotInDictionary = 'WordNotInDictionary',
}

export enum ValidationStatus {
  Invalid = 'Invalid',
  Pending = 'Pending',
  Unvalidated = 'Unvalidated',
  Valid = 'Valid',
}

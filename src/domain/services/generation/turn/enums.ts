export enum GenerationCommandType {
  ContinueExecute = 'ContinueExecute',
  ReturnResult = 'ReturnResult',
  StopExecute = 'StopExecute',
}

export enum GenerationDirection {
  Right = 1,
}

export enum GenerationTask {
  ApplyResolution = 'ApplyResolution',
  CalculateCandidate = 'CalculateCandidate',
  EvaluateTraversal = 'EvaluateTraversal',
  ResolveCandidate = 'ResolveCandidate',
  ReverseResolution = 'ReverseResolution',
  ValidateTraversal = 'ValidateTraversal',
}

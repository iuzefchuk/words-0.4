import type {
  GameDictionaryBuffer,
  GameGeneratorContextData,
  GameGeneratorPartition,
  GameGeneratorResult,
  GamePlayer,
} from '@/app/types/index.ts';

export enum TurnGenerationWorkerRequestType {
  Generate = 'Generate',
  Init = 'Init',
}

export enum TurnGenerationWorkerResponseType {
  Done = 'Done',
  Error = 'Error',
  Ready = 'Ready',
  Result = 'Result',
}

export type TurnGenerationWorkerInput = {
  attemptsLimit: number;
  buffer: GameDictionaryBuffer;
  crossCheckBuffer: ArrayBuffer | SharedArrayBuffer;
  partition?: GameGeneratorPartition;
  player: GamePlayer;
} & GameGeneratorContextData;

export type TurnGenerationWorkerRequest =
  | { input: GameDictionaryBuffer; type: TurnGenerationWorkerRequestType.Init }
  | { input: TurnGenerationWorkerInput; type: TurnGenerationWorkerRequestType.Generate };

export type TurnGenerationWorkerResponse =
  | { error: string; type: TurnGenerationWorkerResponseType.Error }
  | { type: TurnGenerationWorkerResponseType.Done }
  | { type: TurnGenerationWorkerResponseType.Ready }
  | { type: TurnGenerationWorkerResponseType.Result; value: GameGeneratorResult };

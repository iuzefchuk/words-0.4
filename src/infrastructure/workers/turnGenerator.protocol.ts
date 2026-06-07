import type { DomainMatchPlayer } from '@/app/enums/index.ts';
import type {
  DomainTurnGenerationContextData,
  DomainTurnGenerationPartition,
  DomainTurnGenerationResult,
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
  buffer: DictionaryBuffer;
  crossCheckBuffer: ArrayBuffer | SharedArrayBuffer;
  partition?: DomainTurnGenerationPartition;
  player: DomainMatchPlayer;
} & DomainTurnGenerationContextData;

export type TurnGenerationWorkerRequest =
  | { input: DictionaryBuffer; type: TurnGenerationWorkerRequestType.Init }
  | { input: TurnGenerationWorkerInput; type: TurnGenerationWorkerRequestType.Generate };

export type TurnGenerationWorkerResponse =
  | { error: string; type: TurnGenerationWorkerResponseType.Error }
  | { type: TurnGenerationWorkerResponseType.Done }
  | { type: TurnGenerationWorkerResponseType.Ready }
  | { type: TurnGenerationWorkerResponseType.Result; value: DomainTurnGenerationResult };

type DictionaryBuffer = ArrayBufferLike;

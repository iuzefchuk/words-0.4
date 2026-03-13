import { Placement, ComputedValue, ValidationStatus, ValidationErrors } from '@/domain/turn/types.ts';
import { GameContext } from '@/application/types.ts';
import { TileId } from '@/domain/tiles/types.ts';
import { CellIndex } from '@/domain/board/types.ts';

export type ValidatorArguments = { initialPlacement: Placement };

type ComputedSequences = { sequences: { cell: ReadonlyArray<CellIndex>; tile: ReadonlyArray<TileId> } };
type ComputedPlacements = { placements: ReadonlyArray<Placement> };
type ComputedWords = { words: ReadonlyArray<string> };
type ComputedScore = { score: number };

export type PendingResult<State> = { status: ValidationStatus.Pending; state: State };

export type PipelineInput = { context: GameContext } & ValidatorArguments;
export type PipelineThroughput<State> =
  | PendingResult<State>
  | { status: ValidationStatus.Invalid; error: ValidationErrors };
export type PipelineState<Output extends ComputedValue> = PipelineInput & Output;
export type PipelineOutput =
  | { status: ValidationStatus.Invalid; error: ValidationErrors }
  | ({ status: ValidationStatus.Valid } & ComputedSequences & ComputedPlacements & ComputedWords & ComputedScore);

export type SequencesOutput = ComputedSequences;
export type PlacementsOutput = SequencesOutput & ComputedPlacements;
export type WordsOutput = PlacementsOutput & ComputedWords;
export type ScoreOutput = WordsOutput & ComputedScore;

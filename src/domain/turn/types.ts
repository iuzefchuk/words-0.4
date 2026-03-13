import { CellIndex } from '@/domain/board/types.ts';
import { TileId } from '@/domain/tiles/types.ts';
import Placement from '@/domain/turn/Placement.ts';

export { default as Placement } from '@/domain/turn/Placement.ts';
export type { Link } from '@/domain/turn/Placement.ts';

export enum ValidationStatus {
  Unvalidated = 'Unvalidated',
  Pending = 'Pending',
  Invalid = 'Invalid',
  Valid = 'Valid',
}

export enum ValidationErrors {
  InvalidTilePlacement = 'error_tile_1',
  InvalidCellPlacement = 'error_cell_2',
  NoCellsUsableAsFirst = 'error_cell_3',
  WordNotInDictionary = 'error_tile_4',
}

type ComputedSequences = { sequences: { cell: ReadonlyArray<CellIndex>; tile: ReadonlyArray<TileId> } };
type ComputedPlacements = { placements: ReadonlyArray<Placement> };
type ComputedWords = { words: ReadonlyArray<string> };
type ComputedScore = { score: number };

export type ComputedValue = ComputedSequences | ComputedPlacements | ComputedWords | ComputedScore;

export type UnvalidatedResult = { status: ValidationStatus.Unvalidated };
export type InvalidResult = { status: ValidationStatus.Invalid; error: ValidationErrors };
export type ValidResult = { status: ValidationStatus.Valid } & ComputedSequences &
  ComputedPlacements &
  ComputedWords &
  ComputedScore;
export type ValidationResult = UnvalidatedResult | InvalidResult | ValidResult;

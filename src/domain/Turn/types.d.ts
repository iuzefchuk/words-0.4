import { TurnManager as TurnManagerClass } from '@/domain/Turn/_index.ts';
import { ValidationType } from '@/domain/Turn/enums.ts';

declare namespace Locals {
  type Link = { readonly cell: CellIndex; readonly tile: TileId };

  type UnvalidatedValidationResult = { type: ValidationType.Unvalidated };
  type InvalidValidationResult = { type: ValidationType.Invalid; error: string };
  type ValidValidationResult = { type: ValidationType.Valid } & ValidationComputeds;
  type ValidationResult = UnvalidatedValidationResult | InvalidValidationResult | ValidValidationResult;

  type ValidationComputeds = {
    sequences: { cell: ReadonlyArray<CellIndex>; tile: ReadonlyArray<TileId> };
    score: number;
    words: ReadonlyArray<string>;
  };
}

declare global {
  type TurnManager = TurnManagerClass;

  type Placement = Array<Locals.Link>;
}

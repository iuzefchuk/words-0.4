import { Axis, Letter } from '@/domain/enums.ts';
import TurnkeeperClass from '@/domain/Turnkeeper/_index.ts';
import {
  GenerationDirection,
  GenerationPhase,
  GenerationTransitionResultType,
  ValidationErrors,
  ValidationResultType,
} from '@/domain/Turnkeeper/enums.ts';

declare global {
  type Turnkeeper = TurnkeeperClass;
  type Placement = Array<Common.Link>;
}

declare namespace Common {
  type Link = { readonly cell: CellIndex; readonly tile: TileId };
  type UnvalidatedValidationResult = { type: ValidationResultType.Unvalidated };
  type InvalidValidationResult = { type: ValidationResultType.Invalid; error: string };
  type ValidValidationResult = { type: ValidationResultType.Valid } & ValidationComputeds;
  type ValidationResult = UnvalidatedValidationResult | InvalidValidationResult | ValidValidationResult;
  type ValidationComputeds = {
    sequences: { cell: ReadonlyArray<CellIndex>; tile: ReadonlyArray<TileId> };
    score: number;
    words: ReadonlyArray<string>;
  };
}

declare namespace Computation {
  type CachedAnchorLettersComputer = { find(coords: AnchorCoordinates): ReadonlySet<Letter> };
}

declare namespace Generation {
  // TODO revisit naming

  type Computeds = { axisCells: ReadonlyArray<CellIndex>; oppositeAxis: Axis };
  type Context = { tiles: TileCollection; placement: Placement };
  type Cursor = { index: number; direction: GenerationDirection; entry: Entry };
  type Target = { index: number; meta: { cell: CellIndex; tile?: TileId } };
  type ResolveResults = { letter: Letter; tile: TileId };

  type ExploreFrame = { phase: GenerationPhase.Explore; cursor: Cursor };
  type ValidateBoundsFrame = { phase: GenerationPhase.ValidateBounds; cursor: Cursor };
  type CalculateTargetFrame = { phase: GenerationPhase.CalculateTarget; cursor: Cursor };
  type ResolveTargetFrame = { phase: GenerationPhase.ResolveTarget; cursor: Cursor; target: Target };
  type UndoResolveTargetFrame = { phase: GenerationPhase.UndoResolveTarget; cursor: Cursor; results: ResolveResults };
  type Frame = ExploreFrame | ValidateBoundsFrame | CalculateTargetFrame | ResolveTargetFrame | UndoResolveTargetFrame;

  type PassTransitionResult = { type: GenerationTransitionResultType.Continue; frames: Array<Frame> };
  type SucceedTransitionResult = { type: GenerationTransitionResultType.Success; placement: Placement };
  type FailTransitionResult = { type: GenerationTransitionResultType.Fail };
  type TransitionResult = PassTransitionResult | SucceedTransitionResult | FailTransitionResult;
}

declare namespace Validation {
  type Dependencies = { layout: Layout; dictionary: Dictionary; inventory: Inventory; turnkeeper: Turnkeeper };
  type BaseContext = { initialPlacement: Placement; dependencies: Dependencies };
  type SequencesContext = BaseContext & { sequences: { cell: ReadonlyArray<CellIndex>; tile: ReadonlyArray<TileId> } };
  type PlacementsContext = SequencesContext & { placements: ReadonlyArray<Placement> };
  type WordsContext = PlacementsContext & { words: ReadonlyArray<string> };
  type ScoreContext = WordsContext & { score: number };
  type PipelineResult<Context> = ValidPipelineResult<Context> | InvalidPipelineResult;
  type ValidPipelineResult<Context> = { isValid: true; ctx: Context };
  type InvalidPipelineResult = { isValid: false; error: ValidationErrors };
}

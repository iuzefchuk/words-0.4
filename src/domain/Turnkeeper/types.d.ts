import { Letter } from '@/domain/enums.ts';
import { Turnkeeper as TurnkeeperClass } from '@/domain/Turnkeeper/_index.ts';
import {
  Direction,
  SearchPhase,
  TransitionResultType,
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
  type Cursor = { index: number; direction: Direction; entry: Entry };
  type Target = { index: number; meta: { cell: CellIndex; tile?: TileId } };
  type TargetGenerator = { value: NextEntryGenerator; meta: { anchorLetters: ReadonlySet<Letter> } };
  type ResolveResults = { letter: Letter; tile: TileId };
  type ExploreFrame = {
    phase: SearchPhase.Explore;
    cursor: Cursor;
  };
  type ValidateBoundsFrame = {
    phase: SearchPhase.ValidateBounds;
    cursor: Cursor;
  };
  type CalculateTargetFrame = {
    phase: SearchPhase.CalculateTarget;
    cursor: Cursor;
  };
  type ResolveTargetFrame = {
    phase: SearchPhase.ResolveTarget;
    cursor: Cursor;
    target: Target;
  };
  type IterativelyResolveTargetFrame = {
    phase: SearchPhase.IterativelyResolveTarget;
    cursor: Cursor;
    target: Target;
    generator: TargetGenerator;
  };
  type UndoResolveTargetFrame = {
    phase: SearchPhase.UndoResolveTarget;
    cursor: Cursor;
    resolveResults: ResolveResults;
  };
  type SearchFrame =
    | ExploreFrame
    | ValidateBoundsFrame
    | CalculateTargetFrame
    | ResolveTargetFrame
    | IterativelyResolveTargetFrame
    | UndoResolveTargetFrame;
  type SearchContext = { tiles: TileCollection; placement: Placement };
  type PassTransitionResult = { type: TransitionResultType.Continue; frames: Array<SearchFrame> };
  type SucceedTransitionResult = { type: TransitionResultType.Success; placement: Placement };
  type FailTransitionResult = { type: TransitionResultType.Fail };
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

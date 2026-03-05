import { Dictionary, Entry, NextEntryGenerator } from '@/domain/Dictionary/Dictionary.js';
import { Letter, TileId, Inventory, TileCollection } from '@/domain/Inventory/Inventory.js';
import { CellIndex, Layout, Coordinates, Axis } from '@/domain/Layout/Layout.js';
import { TurnManager, Placement, StateType } from '../Turn.js';
import { StateValidator } from './StateValidator.js';
import { CachedUsableLettersComputer } from './UsableLettersComputer.js';

type Cursor = { index: number; direction: Direction; entry: Entry };
type Target = { index: number; meta: { cell: CellIndex; tile?: TileId } };
type TargetGenerator = { value: NextEntryGenerator; meta: { usableLetters: ReadonlySet<Letter> } };
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

enum SearchPhase {
  Explore = 'Explore',
  ValidateBounds = 'ValidateBounds',
  CalculateTarget = 'CalculateTarget',
  ResolveTarget = 'ResolveTarget',
  IterativelyResolveTarget = 'IterativelyResolveTarget',
  UndoResolveTarget = 'UndoResolveTarget',
}

enum Direction {
  Left = -1,
  Right = 1,
}

enum TransitionResultType {
  Continue = 'Continue',
  Success = 'Success',
  Fail = 'Fail',
}

export class PlacementFinder {
  constructor(
    private readonly layout: Layout,
    private readonly dictionary: Dictionary,
    private readonly inventory: Inventory,
    private readonly turnManager: TurnManager,
    private readonly cachedUsableLettersComputer: CachedUsableLettersComputer,
  ) {}

  *search({
    playerTileCollection,
    coords,
  }: {
    playerTileCollection: TileCollection;
    coords: Coordinates;
  }): Generator<Placement> {
    const computeds = {
      axisCells: this.layout.getAxisCells(coords),
      oppositeAxis: this.layout.getOppositeAxis(coords.axis),
    };
    const startIndex = computeds.axisCells.indexOf(coords.cell);
    if (startIndex === -1) return;
    const context: SearchContext = { tiles: new Map(playerTileCollection), placement: [] };
    const stack: Array<SearchFrame> = [
      {
        phase: SearchPhase.Explore,
        cursor: { index: startIndex, direction: Direction.Left, entry: this.dictionary.firstEntry },
      },
    ];
    while (stack.length > 0) {
      const frame = stack.pop()!;
      const result = this.transitionFrame(frame, context, computeds);
      if (result.type === TransitionResultType.Success) {
        yield [...result.placement];
        continue;
      }
      if (result.type === TransitionResultType.Continue) {
        for (let i = result.frames.length - 1; i >= 0; i--) stack.push(result.frames[i]);
      }
    }
  }

  private transitionFrame(
    frame: SearchFrame,
    context: SearchContext,
    computeds: { axisCells: ReadonlyArray<CellIndex>; oppositeAxis: Axis },
  ): TransitionResult {
    switch (frame.phase) {
      case SearchPhase.Explore:
        return this.explore(frame, context);
      case SearchPhase.ValidateBounds:
        return this.validateBounds(frame);
      case SearchPhase.CalculateTarget:
        return this.calculateTarget(frame, computeds.axisCells);
      case SearchPhase.ResolveTarget:
        return this.resolveTarget(frame, computeds.oppositeAxis);
      case SearchPhase.IterativelyResolveTarget:
        return this.iterativelyResolveTarget(frame, context);
      case SearchPhase.UndoResolveTarget:
        return this.undoResolveTarget(frame, context);
    }
  }

  private explore(frame: ExploreFrame, context: SearchContext): TransitionResult {
    const { cursor } = frame;
    const placementIsUsable = context.placement.length > 0 && this.dictionary.isEntryPlayable(cursor.entry);
    if (cursor.direction === Direction.Right && placementIsUsable) {
      const result = StateValidator.execute(
        context.placement,
        this.layout,
        this.dictionary,
        this.inventory,
        this.turnManager,
      );
      if (result.type === StateType.Valid) return PlacementFinder.succeedTransition(context.placement);
    }
    const frames: Array<SearchFrame> = [];
    if (cursor.direction === Direction.Left) {
      frames.push({ phase: SearchPhase.Explore, cursor: { ...cursor, direction: Direction.Right } });
    }
    frames.push({ ...frame, phase: SearchPhase.ValidateBounds });
    return PlacementFinder.passTransition(frames);
  }

  private validateBounds(frame: ValidateBoundsFrame): TransitionResult {
    const { cursor } = frame;
    const isEdge =
      cursor.direction === Direction.Left
        ? this.layout.isCellPositionOnLeftEdge(cursor.index)
        : this.layout.isCellPositionOnRightEdge(cursor.index);
    if (isEdge) return PlacementFinder.failTransition();
    return PlacementFinder.passTransition([{ ...frame, phase: SearchPhase.CalculateTarget }]);
  }

  private calculateTarget(frame: CalculateTargetFrame, axisCells: ReadonlyArray<CellIndex>): TransitionResult {
    const { cursor } = frame;
    const targetIndex = cursor.index + cursor.direction;
    const cell = axisCells[targetIndex];
    const tile = this.turnManager.findTileByCell(cell);
    return PlacementFinder.passTransition([
      {
        ...frame,
        phase: SearchPhase.ResolveTarget,
        target: { index: targetIndex, meta: { cell, tile } },
      },
    ]);
  }

  private resolveTarget(frame: ResolveTargetFrame, oppositeAxis: Axis): TransitionResult {
    const { cursor, target } = frame;
    if (target.meta.tile) {
      const letter = this.inventory.getTileLetter(target.meta.tile);
      const nextEntry = this.dictionary.findEntryForWord({ word: letter, startEntry: cursor.entry });
      if (!nextEntry) return PlacementFinder.failTransition();
      return PlacementFinder.passTransition([
        { phase: SearchPhase.Explore, cursor: { ...cursor, index: target.index, entry: nextEntry } },
      ]);
    }
    return PlacementFinder.passTransition([
      {
        phase: SearchPhase.IterativelyResolveTarget,
        cursor,
        target,
        generator: {
          value: this.dictionary.createNextEntryGenerator({ startEntry: cursor.entry }),
          meta: {
            usableLetters: this.cachedUsableLettersComputer.getFor({ axis: oppositeAxis, cell: target.meta.cell }),
          },
        },
      },
    ]);
  }

  private iterativelyResolveTarget(frame: IterativelyResolveTargetFrame, context: SearchContext): TransitionResult {
    const { cursor, target, generator } = frame;
    const next = generator.value.next();
    if (next.done) return PlacementFinder.failTransition();
    const [possibleNextLetter, entryWithPossibleNextLetter] = next.value;
    const letterTiles = context.tiles.get(possibleNextLetter);
    if (!generator.meta.usableLetters.has(possibleNextLetter) || !letterTiles || letterTiles.length === 0) {
      return PlacementFinder.passTransition([frame]); // continue to next iteration
    }
    const tile = letterTiles.pop()!;
    context.placement.push({ cell: target.meta.cell, tile });
    return PlacementFinder.passTransition([
      frame, // continue to next iteration
      { phase: SearchPhase.UndoResolveTarget, cursor, resolveResults: { letter: possibleNextLetter, tile } },
      { phase: SearchPhase.Explore, cursor: { ...cursor, index: target.index, entry: entryWithPossibleNextLetter } },
    ]);
  }

  private undoResolveTarget(frame: UndoResolveTargetFrame, context: SearchContext): TransitionResult {
    const { letter, tile } = frame.resolveResults;
    context.tiles.get(letter)!.push(tile);
    context.placement.pop();
    return PlacementFinder.passTransition([]);
  }

  private static passTransition(frames: Array<SearchFrame>): PassTransitionResult {
    return { type: TransitionResultType.Continue, frames };
  }

  private static succeedTransition(placement: Placement): SucceedTransitionResult {
    return { type: TransitionResultType.Success, placement };
  }

  private static failTransition(): FailTransitionResult {
    return { type: TransitionResultType.Fail };
  }
}

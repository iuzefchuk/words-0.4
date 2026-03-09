import { GameContext } from '@/domain/types.ts';
import Dictionary from '@/domain/Dictionary/index.ts';
import Inventory from '@/domain/Inventory/index.ts';
import { TileCollection, TileId } from '@/domain/Inventory/types/shared.ts';
import { Layout, AnchorCoordinates, CellIndex } from '@/domain/Layout/types/shared.ts';
import TurnValidator from '@/domain/Turnkeeper/TurnValidator.ts';
// import {
//   GenerationDirection,
//   GenerationPhase,
//   GenerationTransitionStatus,
//   ValidationStatus,
// } from '@/domain/Turnkeeper/enums.ts';
// import {
//   Computeds,
//   Context,
//   Frame,
//   TransitionResult,
//   ExploreFrame,
//   ValidateBoundsFrame,
//   CalculateTargetFrame,
//   ResolveTargetFrame,
//   UndoResolveTargetFrame,
//   ContinueTransitionResult,
//   SucceedTransitionResult,
//   FailTransitionResult,
// } from '@/domain/Turnkeeper/types/local/generation.ts';
import { CachedAnchorLettersComputer } from '@/domain/Turnkeeper/types/local/index.ts';
import { Turnkeeper, Placement } from '@/domain/Turnkeeper/types/shared.ts';
//del
import { Entry } from '@/domain/Dictionary/types/shared.ts';
import { Axis, Letter } from '@/domain/enums.ts';
import { ValidationStatus } from '../enums.ts';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

enum GenerationPhase {
  Explore = 'Explore',
  ValidateBounds = 'ValidateBounds',
  CalculateTarget = 'CalculateTarget',
  ResolveTarget = 'ResolveTarget',
  DoResolveTarget = 'DoResolveTarget',
  UndoResolveTarget = 'UndoResolveTarget',
}

enum GenerationDirection {
  Left = -1,
  Right = 1,
}

enum GenerationTransitionStatus {
  Continue = 'Continue',
  Success = 'Success',
  Fail = 'Fail',
}

export type Computeds = { axisCells: ReadonlyArray<CellIndex>; oppositeAxis: Axis };
export type Context = { tiles: TileCollection; placement: Placement };
export type Cursor = { index: number; direction: GenerationDirection; entry: Entry };
export type Target = { index: number; meta: { cell: CellIndex; tile?: TileId } };
export type ResolveResults = { letter: Letter; tile: TileId };

export type ExploreFrame = { phase: GenerationPhase.Explore; cursor: Cursor };
export type ValidateBoundsFrame = { phase: GenerationPhase.ValidateBounds; cursor: Cursor };
export type CalculateTargetFrame = { phase: GenerationPhase.CalculateTarget; cursor: Cursor };
export type ResolveTargetFrame = { phase: GenerationPhase.ResolveTarget; cursor: Cursor; target: Target };
export type DoResolveTargetFrame = {
  phase: GenerationPhase.DoResolveTarget;
  cursor: Cursor;
  target: Target;
  results: ResolveResults;
};
export type UndoResolveTargetFrame = {
  phase: GenerationPhase.UndoResolveTarget;
  cursor: Cursor;
  results: ResolveResults;
};
export type Frame =
  | ExploreFrame
  | ValidateBoundsFrame
  | CalculateTargetFrame
  | ResolveTargetFrame
  | DoResolveTargetFrame
  | UndoResolveTargetFrame;

export type ContinueTransitionResult = { type: GenerationTransitionStatus.Continue; frames: Array<Frame> };
export type SucceedTransitionResult = { type: GenerationTransitionStatus.Success; placement: Placement };
export type FailTransitionResult = { type: GenerationTransitionStatus.Fail };
export type TransitionResult = ContinueTransitionResult | SucceedTransitionResult | FailTransitionResult;

export default class PlacementGenerator {
  constructor(
    private readonly context: GameContext,
    private readonly cachedAnchorLettersComputer: CachedAnchorLettersComputer,
  ) {}

  private get layout(): Layout {
    return this.context.layout;
  }
  private get dictionary(): Dictionary {
    return this.context.dictionary;
  }
  private get inventory(): Inventory {
    return this.context.inventory;
  }
  private get turnkeeper(): Turnkeeper {
    return this.context.turnkeeper;
  }

  *execute({
    playerTileCollection,
    coords,
  }: {
    playerTileCollection: TileCollection;
    coords: AnchorCoordinates;
  }): Generator<Placement> {
    const context: Context = { tiles: new Map(playerTileCollection), placement: [] };
    const computeds: Computeds = {
      axisCells: this.layout.getAxisCells(coords),
      oppositeAxis: this.layout.getOppositeAxis(coords.axis),
    };
    const startIndex = computeds.axisCells.indexOf(coords.cellIndex);
    if (startIndex === -1) throw new Error('Start index has to exist');
    const pendingTasks: Array<Frame> = [
      {
        phase: GenerationPhase.Explore,
        cursor: { index: startIndex, direction: GenerationDirection.Left, entry: this.dictionary.firstEntry },
      },
    ];
    while (pendingTasks.length > 0) {
      const task = pendingTasks.pop()!; // todo rename rest
      const result = this.transition(task, context, computeds);
      if (result.type === GenerationTransitionStatus.Success) {
        yield [...result.placement];
        continue;
      }
      if (result.type === GenerationTransitionStatus.Continue) {
        for (let i = result.frames.length - 1; i >= 0; i--) pendingTasks.push(result.frames[i]);
      }
    }
  }

  private transition(frame: Frame, context: Context, computeds: Computeds): TransitionResult {
    switch (frame.phase) {
      case GenerationPhase.Explore:
        return this.explore(frame, context);
      case GenerationPhase.ValidateBounds:
        return this.validateBounds(frame);
      case GenerationPhase.CalculateTarget:
        return this.calculateTarget(frame, computeds);
      case GenerationPhase.ResolveTarget:
        return this.resolveTarget(frame, context, computeds);
      case GenerationPhase.DoResolveTarget:
        return this.doResolveTarget(frame, context);
      case GenerationPhase.UndoResolveTarget:
        return this.undoResolveTarget(frame, context);
    }
  }

  private explore(frame: ExploreFrame, context: Context): TransitionResult {
    const { cursor } = frame;
    const placementIsUsable = context.placement.length > 0 && this.dictionary.isEntryPlayable(cursor.entry);
    if (cursor.direction === GenerationDirection.Right && placementIsUsable) {
      const ValidationResult = new TurnValidator(this.context).execute(context.placement);
      if (ValidationResult.status === ValidationStatus.Valid) {
        return PlacementGenerator.succeedTransition(context.placement);
      }
    }
    const frames: Array<Frame> = [];
    if (cursor.direction === GenerationDirection.Left) {
      frames.push({
        phase: GenerationPhase.Explore,
        cursor: { ...cursor, direction: GenerationDirection.Right },
      });
    }
    frames.push({ ...frame, phase: GenerationPhase.ValidateBounds });
    return PlacementGenerator.continueTransition(frames);
  }

  private validateBounds(frame: ValidateBoundsFrame): TransitionResult {
    const { cursor } = frame;
    const isEdge =
      cursor.direction === GenerationDirection.Left
        ? this.layout.isCellPositionOnLeftEdge(cursor.index)
        : this.layout.isCellPositionOnRightEdge(cursor.index);
    if (isEdge) return PlacementGenerator.failTransition();
    return PlacementGenerator.continueTransition([{ ...frame, phase: GenerationPhase.CalculateTarget }]);
  }

  private calculateTarget(frame: CalculateTargetFrame, computeds: Computeds): TransitionResult {
    const { cursor } = frame;
    const targetIndex = cursor.index + cursor.direction;
    const cell = computeds.axisCells[targetIndex];
    const tile = this.turnkeeper.findTileByCell(cell);
    return PlacementGenerator.continueTransition([
      {
        ...frame,
        phase: GenerationPhase.ResolveTarget,
        target: { index: targetIndex, meta: { cell, tile } },
      },
    ]);
  }

  private resolveTarget(frame: ResolveTargetFrame, context: Context, computeds: Computeds): TransitionResult {
    const { cursor, target } = frame;
    if (target.meta.tile) {
      const letter = this.inventory.getTileLetter(target.meta.tile);
      const nextEntry = this.dictionary.findEntryForWord({ word: letter, startEntry: cursor.entry });
      if (!nextEntry) return PlacementGenerator.failTransition();
      return PlacementGenerator.continueTransition([
        { phase: GenerationPhase.Explore, cursor: { ...cursor, index: target.index, entry: nextEntry } },
      ]);
    }
    const generator = this.dictionary.createNextEntryGenerator({ startEntry: cursor.entry });
    const anchorLetters = this.cachedAnchorLettersComputer.find({
      axis: computeds.oppositeAxis,
      cellIndex: target.meta.cell,
    });
    const branchFrames: Array<Frame> = [];
    for (const [possibleNextLetter, entryWithPossibleNextLetter] of generator) {
      const letterTiles = context.tiles.get(possibleNextLetter);
      if (!anchorLetters.has(possibleNextLetter) || !letterTiles || letterTiles.length === 0) {
        continue;
      }
      const tile = letterTiles[letterTiles.length - 1];
      branchFrames.push(
        {
          phase: GenerationPhase.DoResolveTarget,
          cursor,
          target,
          results: { letter: possibleNextLetter, tile },
        },
        {
          phase: GenerationPhase.Explore,
          cursor: { ...cursor, index: target.index, entry: entryWithPossibleNextLetter },
        },
        {
          phase: GenerationPhase.UndoResolveTarget,
          cursor,
          results: { letter: possibleNextLetter, tile },
        },
      );
    }

    if (branchFrames.length === 0) return PlacementGenerator.failTransition();
    return PlacementGenerator.continueTransition(branchFrames);
  }

  private doResolveTarget(frame: DoResolveTargetFrame, context: Context): TransitionResult {
    const { target, results } = frame;
    const letterTiles = context.tiles.get(results.letter)!;
    const tileIndex = letterTiles.indexOf(results.tile);
    if (tileIndex !== -1) letterTiles.splice(tileIndex, 1);
    context.placement.push({ cell: target.meta.cell, tile: results.tile });
    return PlacementGenerator.continueTransition([]);
  }

  private undoResolveTarget(frame: UndoResolveTargetFrame, context: Context): TransitionResult {
    const { letter, tile } = frame.results;
    context.tiles.get(letter)!.push(tile);
    context.placement.pop();
    return PlacementGenerator.continueTransition([]);
  }

  private static continueTransition(frames: Array<Frame>): ContinueTransitionResult {
    return { type: GenerationTransitionStatus.Continue, frames };
  }

  private static succeedTransition(placement: Placement): SucceedTransitionResult {
    return { type: GenerationTransitionStatus.Success, placement };
  }

  private static failTransition(): FailTransitionResult {
    return { type: GenerationTransitionStatus.Fail };
  }
}

import type { Computation as C, Generation as G } from '@/domain/Turnkeeper/types.js';
import TurnValidator from '@/domain/Turnkeeper/TurnValidator.js';
import {
  GenerationDirection as Direction,
  GenerationPhase as Phase,
  GenerationTransitionResultType as TransitionResultType,
  ValidationResultType,
} from '@/domain/Turnkeeper/enums.js';

export default class PlacementGenerator {
  constructor(
    private readonly layout: Layout,
    private readonly dictionary: Dictionary,
    private readonly inventory: Inventory,
    private readonly turnkeeper: Turnkeeper,
    private readonly cachedAnchorLettersComputer: C.CachedAnchorLettersComputer,
  ) {}

  *execute({
    playerTileCollection,
    coords,
  }: {
    playerTileCollection: TileCollection;
    coords: AnchorCoordinates;
  }): Generator<Placement> {
    const computeds: G.Computeds = {
      axisCells: this.layout.getAxisCells(coords),
      oppositeAxis: this.layout.getOppositeAxis(coords.axis),
    };
    const startIndex = computeds.axisCells.indexOf(coords.index);
    if (startIndex === -1) return;
    const context: G.Context = { tiles: new Map(playerTileCollection), placement: [] };
    const stack: Array<G.Frame> = [
      {
        phase: Phase.Explore,
        cursor: { index: startIndex, direction: Direction.Left, entry: this.dictionary.firstEntry },
      },
    ];
    while (stack.length > 0) {
      const frame = stack.pop()!;
      const result = this.transition(frame, context, computeds);
      if (result.type === TransitionResultType.Success) {
        yield [...result.placement];
        continue;
      }
      if (result.type === TransitionResultType.Continue) {
        for (let i = result.frames.length - 1; i >= 0; i--) stack.push(result.frames[i]);
      }
    }
  }

  private transition(frame: G.Frame, context: G.Context, computeds: G.Computeds): G.TransitionResult {
    switch (frame.phase) {
      case Phase.Explore:
        return this.explore(frame, context);
      case Phase.ValidateBounds:
        return this.validateBounds(frame);
      case Phase.CalculateTarget:
        return this.calculateTarget(frame, computeds);
      case Phase.ResolveTarget:
        return this.resolveTarget(frame, context, computeds);
      case Phase.UndoResolveTarget:
        return this.undoResolveTarget(frame, context);
    }
  }

  private explore(frame: G.ExploreFrame, context: G.Context): G.TransitionResult {
    const { cursor } = frame;
    const placementIsUsable = context.placement.length > 0 && this.dictionary.isEntryPlayable(cursor.entry);
    if (cursor.direction === Direction.Right && placementIsUsable) {
      const validationResult = new TurnValidator(this.layout, this.dictionary, this.inventory, this.turnkeeper).execute(
        context.placement,
      );
      if (validationResult.type === ValidationResultType.Valid) {
        return PlacementGenerator.succeedTransition(context.placement);
      }
    }
    const frames: Array<G.Frame> = [];
    if (cursor.direction === Direction.Left) {
      frames.push({
        phase: Phase.Explore,
        cursor: { ...cursor, direction: Direction.Right },
      });
    }
    frames.push({ ...frame, phase: Phase.ValidateBounds });
    return PlacementGenerator.passTransition(frames);
  }

  private validateBounds(frame: G.ValidateBoundsFrame): G.TransitionResult {
    const { cursor } = frame;
    const isEdge =
      cursor.direction === Direction.Left
        ? this.layout.isCellPositionOnLeftEdge(cursor.index)
        : this.layout.isCellPositionOnRightEdge(cursor.index);
    if (isEdge) return PlacementGenerator.failTransition();
    return PlacementGenerator.passTransition([{ ...frame, phase: Phase.CalculateTarget }]);
  }

  private calculateTarget(frame: G.CalculateTargetFrame, computeds: G.Computeds): G.TransitionResult {
    const { cursor } = frame;
    const targetIndex = cursor.index + cursor.direction;
    const cell = computeds.axisCells[targetIndex];
    const tile = this.turnkeeper.findTileByCell(cell);
    return PlacementGenerator.passTransition([
      {
        ...frame,
        phase: Phase.ResolveTarget,
        target: { index: targetIndex, meta: { cell, tile } },
      },
    ]);
  }

  private resolveTarget(frame: G.ResolveTargetFrame, context: G.Context, computeds: G.Computeds): G.TransitionResult {
    const { cursor, target } = frame;
    if (target.meta.tile) {
      const letter = this.inventory.getTileLetter(target.meta.tile);
      const nextEntry = this.dictionary.findEntryForWord({ word: letter, startEntry: cursor.entry });
      if (!nextEntry) return PlacementGenerator.failTransition();
      return PlacementGenerator.passTransition([
        { phase: Phase.Explore, cursor: { ...cursor, index: target.index, entry: nextEntry } },
      ]);
    } else {
      const generator = this.dictionary.createNextEntryGenerator({ startEntry: cursor.entry });
      const anchorLetters = this.cachedAnchorLettersComputer.find({
        axis: computeds.oppositeAxis,
        index: target.meta.cell,
      });
      for (const [possibleNextLetter, entryWithPossibleNextLetter] of generator) {
        const letterTiles = context.tiles.get(possibleNextLetter);
        if (!anchorLetters.has(possibleNextLetter) || !letterTiles || letterTiles.length === 0) {
          continue;
        }
        const tile = letterTiles.pop()!;
        context.placement.push({ cell: target.meta.cell, tile });
        return PlacementGenerator.passTransition([
          { phase: Phase.UndoResolveTarget, cursor, results: { letter: possibleNextLetter, tile } },
          {
            phase: Phase.Explore,
            cursor: { ...cursor, index: target.index, entry: entryWithPossibleNextLetter },
          },
        ]);
      }
      return PlacementGenerator.failTransition();
    }
  }

  private undoResolveTarget(frame: G.UndoResolveTargetFrame, context: G.Context): G.TransitionResult {
    const { letter, tile } = frame.results;
    context.tiles.get(letter)!.push(tile);
    context.placement.pop();
    return PlacementGenerator.passTransition([]);
  }

  private static passTransition(frames: Array<G.Frame>): G.PassTransitionResult {
    return { type: TransitionResultType.Continue, frames };
  }

  private static succeedTransition(placement: Placement): G.SucceedTransitionResult {
    return { type: TransitionResultType.Success, placement };
  }

  private static failTransition(): G.FailTransitionResult {
    return { type: TransitionResultType.Fail };
  }
}

import type { Computation as C, Generation as G } from '@/domain/Turnkeeper/types.js';
import { Axis } from '@/domain/enums.js';
import { TurnValidator } from '@/domain/Turnkeeper/validation/InitialPlacementValidator.js';
import { Direction, SearchPhase, TransitionResultType, ValidationResultType } from '@/domain/Turnkeeper/enums.js';

export class PlacementGenerator {
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
    const computeds = {
      axisCells: this.layout.getAxisCells(coords),
      oppositeAxis: this.layout.getOppositeAxis(coords.axis),
    };
    const startIndex = computeds.axisCells.indexOf(coords.index);
    if (startIndex === -1) return;
    const context: G.SearchContext = { tiles: new Map(playerTileCollection), placement: [] };
    const stack: Array<G.SearchFrame> = [
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
    frame: G.SearchFrame,
    context: G.SearchContext,
    computeds: { axisCells: ReadonlyArray<CellIndex>; oppositeAxis: Axis },
  ): G.TransitionResult {
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

  private explore(frame: G.ExploreFrame, context: G.SearchContext): G.TransitionResult {
    const { cursor } = frame;
    const placementIsUsable = context.placement.length > 0 && this.dictionary.isEntryPlayable(cursor.entry);
    if (cursor.direction === Direction.Right && placementIsUsable) {
      const result = TurnValidator.execute(
        context.placement,
        this.layout,
        this.dictionary,
        this.inventory,
        this.turnkeeper,
      );
      if (result.type === ValidationResultType.Valid) return PlacementGenerator.succeedTransition(context.placement);
    }
    const frames: Array<G.SearchFrame> = [];
    if (cursor.direction === Direction.Left) {
      frames.push({ phase: SearchPhase.Explore, cursor: { ...cursor, direction: Direction.Right } });
    }
    frames.push({ ...frame, phase: SearchPhase.ValidateBounds });
    return PlacementGenerator.passTransition(frames);
  }

  private validateBounds(frame: G.ValidateBoundsFrame): G.TransitionResult {
    const { cursor } = frame;
    const isEdge =
      cursor.direction === Direction.Left
        ? this.layout.isCellPositionOnLeftEdge(cursor.index)
        : this.layout.isCellPositionOnRightEdge(cursor.index);
    if (isEdge) return PlacementGenerator.failTransition();
    return PlacementGenerator.passTransition([{ ...frame, phase: SearchPhase.CalculateTarget }]);
  }

  private calculateTarget(frame: G.CalculateTargetFrame, axisCells: ReadonlyArray<CellIndex>): G.TransitionResult {
    const { cursor } = frame;
    const targetIndex = cursor.index + cursor.direction;
    const cell = axisCells[targetIndex];
    const tile = this.turnkeeper.findTileByCell(cell);
    return PlacementGenerator.passTransition([
      {
        ...frame,
        phase: SearchPhase.ResolveTarget,
        target: { index: targetIndex, meta: { cell, tile } },
      },
    ]);
  }

  private resolveTarget(frame: G.ResolveTargetFrame, oppositeAxis: Axis): G.TransitionResult {
    const { cursor, target } = frame;
    if (target.meta.tile) {
      const letter = this.inventory.getTileLetter(target.meta.tile);
      const nextEntry = this.dictionary.findEntryForWord({ word: letter, startEntry: cursor.entry });
      if (!nextEntry) return PlacementGenerator.failTransition();
      return PlacementGenerator.passTransition([
        { phase: SearchPhase.Explore, cursor: { ...cursor, index: target.index, entry: nextEntry } },
      ]);
    }
    return PlacementGenerator.passTransition([
      {
        phase: SearchPhase.IterativelyResolveTarget,
        cursor,
        target,
        generator: {
          value: this.dictionary.createNextEntryGenerator({ startEntry: cursor.entry }),
          meta: {
            anchorLetters: this.cachedAnchorLettersComputer.find({ axis: oppositeAxis, index: target.meta.cell }),
          },
        },
      },
    ]);
  }

  private iterativelyResolveTarget(
    frame: G.IterativelyResolveTargetFrame,
    context: G.SearchContext,
  ): G.TransitionResult {
    const { cursor, target, generator } = frame;
    const next = generator.value.next();
    if (next.done) return PlacementGenerator.failTransition();
    const [possibleNextLetter, entryWithPossibleNextLetter] = next.value;
    const letterTiles = context.tiles.get(possibleNextLetter);
    if (!generator.meta.anchorLetters.has(possibleNextLetter) || !letterTiles || letterTiles.length === 0) {
      return PlacementGenerator.passTransition([frame]); // continue to next iteration
    }
    const tile = letterTiles.pop()!;
    context.placement.push({ cell: target.meta.cell, tile });
    return PlacementGenerator.passTransition([
      frame, // continue to next iteration
      { phase: SearchPhase.UndoResolveTarget, cursor, resolveResults: { letter: possibleNextLetter, tile } },
      { phase: SearchPhase.Explore, cursor: { ...cursor, index: target.index, entry: entryWithPossibleNextLetter } },
    ]);
  }

  private undoResolveTarget(frame: G.UndoResolveTargetFrame, context: G.SearchContext): G.TransitionResult {
    const { letter, tile } = frame.resolveResults;
    context.tiles.get(letter)!.push(tile);
    context.placement.pop();
    return PlacementGenerator.passTransition([]);
  }

  private static passTransition(frames: Array<G.SearchFrame>): G.PassTransitionResult {
    return { type: TransitionResultType.Continue, frames };
  }

  private static succeedTransition(placement: Placement): G.SucceedTransitionResult {
    return { type: TransitionResultType.Success, placement };
  }

  private static failTransition(): G.FailTransitionResult {
    return { type: TransitionResultType.Fail };
  }
}

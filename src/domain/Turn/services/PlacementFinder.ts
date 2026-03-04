import { FrozenNode, Dictionary } from '@/domain/Dictionary/Dictionary.js';
import { Letter, TileId, Inventory, TileCollection } from '@/domain/Inventory/Inventory.js';
import { CellIndex, Layout, Coordinates, Axis } from '@/domain/Layout/Layout.js';
import { TurnManager, Placement, StateType } from '../Turn.js';
import { StateChecker } from './StateChecker.js';
import { CachedUsableLettersComputer } from './UsableLettersComputer.js';

// naming
// nodes to dictionary ?

type Cursor = { index: number; direction: Direction; node: FrozenNode };
type Target = { index: number; cell: CellIndex; tile?: TileId };
type Branch = { iterator: Iterator<[Letter, FrozenNode]>; usableLetters: ReadonlySet<Letter> };
type Placed = { letter: Letter; tile: TileId };

type ExploreFrame = { phase: SearchPhase.Explore; cursor: Cursor };
type ValidateBoundsFrame = { phase: SearchPhase.ValidateBounds; cursor: Cursor };
type CalculateTargetFrame = { phase: SearchPhase.CalculateTarget; cursor: Cursor };
type ResolveTargetFrame = { phase: SearchPhase.ResolveTarget; cursor: Cursor; target: Target };
type BranchFrame = { phase: SearchPhase.Branch; cursor: Cursor; target: Target; branch: Branch };
type BacktrackFrame = { phase: SearchPhase.Backtrack; cursor: Cursor; placed: Placed };
type SearchFrame =
  | ExploreFrame
  | ValidateBoundsFrame
  | CalculateTargetFrame
  | ResolveTargetFrame
  | BranchFrame
  | BacktrackFrame;

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
  Branch = 'Branch',
  Backtrack = 'Backtrack',
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
        cursor: { index: startIndex, direction: Direction.Left, node: this.dictionary.rootNode },
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
      case SearchPhase.Branch:
        return this.branch(frame, context);
      case SearchPhase.Backtrack:
        return this.backtrack(frame, context);
    }
  }

  private explore(frame: ExploreFrame, context: SearchContext): TransitionResult {
    const { cursor } = frame;
    const { direction, node } = cursor;
    const placementIsUsable = context.placement.length > 0 && node.isFinal;
    if (direction === Direction.Right && placementIsUsable) {
      const result = StateChecker.execute(
        context.placement,
        this.layout,
        this.dictionary,
        this.inventory,
        this.turnManager,
      );
      if (result.type === StateType.Valid) return PlacementFinder.succeedTransition(context.placement);
    }
    const frames: Array<SearchFrame> = [];
    if (direction === Direction.Left) {
      frames.push({ phase: SearchPhase.Explore, cursor: { ...cursor, direction: Direction.Right } });
    }
    frames.push({ phase: SearchPhase.ValidateBounds, cursor });
    return PlacementFinder.passTransition(frames);
  }

  private validateBounds(frame: ValidateBoundsFrame): TransitionResult {
    const { index, direction } = frame.cursor;
    const isEdge =
      direction === Direction.Left
        ? this.layout.isCellPositionOnLeftEdge(index)
        : this.layout.isCellPositionOnRightEdge(index);
    if (isEdge) return PlacementFinder.failTransition();
    return PlacementFinder.passTransition([{ phase: SearchPhase.CalculateTarget, cursor: frame.cursor }]);
  }

  private calculateTarget(frame: CalculateTargetFrame, axisCells: ReadonlyArray<CellIndex>): TransitionResult {
    const { index, direction } = frame.cursor;
    const nextIndex = index + direction;
    const cell = axisCells[nextIndex];
    const tile = this.turnManager.findTileByCell(cell);
    return PlacementFinder.passTransition([
      { phase: SearchPhase.ResolveTarget, cursor: frame.cursor, target: { index: nextIndex, cell, tile } },
    ]);
  }

  private resolveTarget(frame: ResolveTargetFrame, oppositeAxis: Axis): TransitionResult {
    const { cursor, target } = frame;
    const { node } = cursor;
    const { index, cell, tile } = target;
    if (tile) {
      const letter = this.inventory.getTileLetter(tile);
      const nextNode = node.children.get(letter);
      if (!nextNode) return PlacementFinder.failTransition();
      return PlacementFinder.passTransition([
        { phase: SearchPhase.Explore, cursor: { ...cursor, index, node: nextNode } },
      ]);
    }
    const iterator = node.children.entries();
    const usableLetters = this.cachedUsableLettersComputer.getFor({ axis: oppositeAxis, cell });
    return PlacementFinder.passTransition([
      { phase: SearchPhase.Branch, cursor, target, branch: { iterator, usableLetters } },
    ]);
  }

  private branch(frame: BranchFrame, context: SearchContext): TransitionResult {
    const { cursor, target, branch } = frame;
    const { index, cell } = target;
    const { iterator, usableLetters } = branch;
    const next = iterator.next();
    if (next.done) return PlacementFinder.failTransition();
    const [letter, nextNode] = next.value;
    const letterTiles = context.tiles.get(letter);
    if (!usableLetters.has(letter) || !letterTiles || letterTiles.length === 0) {
      return PlacementFinder.passTransition([frame]); // continue iterator
    }
    const tile = letterTiles.pop()!;
    context.placement.push({ cell, tile });
    return PlacementFinder.passTransition([
      frame, // continue iterator
      { phase: SearchPhase.Backtrack, cursor, placed: { letter, tile } },
      { phase: SearchPhase.Explore, cursor: { ...cursor, index, node: nextNode } },
    ]);
  }

  private backtrack(frame: BacktrackFrame, context: SearchContext): TransitionResult {
    const { letter, tile } = frame.placed;
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

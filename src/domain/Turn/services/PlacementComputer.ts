import { FrozenNode, Dictionary } from '@/domain/Dictionary/Dictionary.js';
import { Letter, TileId, Inventory, LetterTiles } from '@/domain/Inventory/Inventory.js';
import { CellIndex, Layout, Coordinates, Axis } from '@/domain/Layout/Layout.js';
import { TurnManager, Placement, TurnStateType } from '../Turn.js';
import { TurnStateComputer } from './TurnStateComputer.js';
import { CachedUsableLettersComputer } from './UsableLettersComputer.js';

type EnterFrame = { stage: Stage.Enter; direction: Direction; node: FrozenNode; position: number };
type AdvanceFrame = { stage: Stage.Advance; direction: Direction; node: FrozenNode; position: number; step: -1 | 1 };
type ExpandFrame = {
  stage: Stage.Expand;
  direction: Direction;
  node: FrozenNode;
  position: number;
  step: -1 | 1;
  nextPosition: number;
  nextCell: CellIndex;
  iterator: Iterator<[Letter, FrozenNode]>;
  usableLetters: ReadonlySet<Letter>;
};
type BacktrackFrame = { stage: Stage.Backtrack; letter: Letter; placedTile: TileId };
type Frame = EnterFrame | AdvanceFrame | ExpandFrame | BacktrackFrame;

enum Stage {
  Enter = 'Enter',
  Advance = 'Advance',
  Expand = 'Expand',
  Backtrack = 'Backtrack',
}

enum Direction {
  Left = 'Left',
  Right = 'Right',
}

export class PlacementComputer {
  constructor(
    private readonly layout: Layout,
    private readonly dictionary: Dictionary,
    private readonly inventory: Inventory,
    private readonly turnManager: TurnManager,
    private readonly cachedUsableLettersComputer: CachedUsableLettersComputer,
  ) {}

  execute({ playerLetterTiles, coords }: { playerLetterTiles: LetterTiles; coords: Coordinates }): Placement | null {
    const tiles = playerLetterTiles;
    const axisCells = this.layout.getAxisCells(coords);
    const oppositeAxis = this.layout.getOppositeAxis(coords.axis);
    const startPosition = axisCells.indexOf(coords.cell);
    if (startPosition === -1) return null;
    const initPlacement: Placement = [];
    const stack: Array<Frame> = [
      { stage: Stage.Enter, direction: Direction.Left, node: this.dictionary.rootNode, position: startPosition },
    ];
    while (stack.length > 0) {
      const frame = stack.pop()!;
      if (frame.stage === Stage.Enter) {
        const validResultIsPossible = initPlacement.length > 0 && frame.node.isFinal;
        if (frame.direction === Direction.Right && validResultIsPossible) {
          const potentialTurnState = TurnStateComputer.execute(
            initPlacement,
            this.layout,
            this.dictionary,
            this.inventory,
            this.turnManager,
          );
          if (potentialTurnState.type === TurnStateType.Valid) return initPlacement;
        }
      }
      if (frame.stage === Stage.Enter) this.enter(stack, frame);
      else if (frame.stage === Stage.Advance) this.advance(stack, frame, axisCells, oppositeAxis);
      else if (frame.stage === Stage.Expand) this.expand(stack, frame, tiles, initPlacement);
      else if (frame.stage === Stage.Backtrack) this.backtrack(frame, tiles, initPlacement);
    }
    return null;
  }

  private enter(stack: Array<Frame>, frame: EnterFrame): void {
    const { direction: phase } = frame;
    if (phase === Direction.Left) {
      stack.push({ ...frame, stage: Stage.Enter, direction: Direction.Right });
      stack.push({ ...frame, stage: Stage.Advance, direction: Direction.Left, step: -1 });
    } else if (phase === Direction.Right) {
      stack.push({ ...frame, stage: Stage.Advance, direction: Direction.Right, step: 1 });
    }
  }

  private advance(
    stack: Array<Frame>,
    frame: AdvanceFrame,
    axisCells: ReadonlyArray<CellIndex>,
    oppositeAxis: Axis,
  ): void {
    const { node, position, step } = frame;
    const isEdge =
      step === -1 ? this.layout.isCellPositionOnLeftEdge(position) : this.layout.isCellPositionOnRightEdge(position);
    if (isEdge) return;
    const nextPosition = position + step;
    if (nextPosition < 0 || nextPosition >= axisCells.length) return;
    const nextCell = axisCells[nextPosition];
    const connectedTile = this.turnManager.findTileByCell(nextCell);
    if (connectedTile) {
      const letter = this.inventory.getTileLetter(connectedTile);
      const nextNode = node.children.get(letter);
      if (!nextNode) return;
      stack.push({ ...frame, stage: Stage.Enter, node: nextNode, position: nextPosition });
    } else {
      stack.push({
        ...frame,
        stage: Stage.Expand,
        nextPosition,
        nextCell,
        iterator: node.children.entries(),
        usableLetters: this.cachedUsableLettersComputer.getFor({ axis: oppositeAxis, cell: nextCell }),
      });
    }
  }

  private expand(stack: Array<Frame>, frame: ExpandFrame, tiles: LetterTiles, initPlacement: Placement): void {
    const { direction, nextPosition, nextCell, iterator, usableLetters } = frame;
    const next = iterator.next();
    if (next.done) return;
    const [letter, nextNode] = next.value;
    stack.push(frame);
    if (!usableLetters.has(letter)) return;
    const tilesWithLetter = tiles.get(letter);
    if (!tilesWithLetter || tilesWithLetter.length === 0) return;
    const tile = tilesWithLetter.pop();
    if (!tile) throw new Error('Tile has to exist');
    initPlacement.push({ cell: nextCell, tile });
    stack.push({ stage: Stage.Backtrack, letter, placedTile: tile });
    stack.push({ stage: Stage.Enter, direction, node: nextNode, position: nextPosition });
  }

  private backtrack(frame: BacktrackFrame, tiles: LetterTiles, initPlacement: Placement): void {
    const { letter, placedTile } = frame;
    const tilesWithLetter = tiles.get(letter);
    if (!tilesWithLetter) throw new Error('Backtracked letter has to exist');
    tilesWithLetter.push(placedTile);
    initPlacement.pop();
  }
}

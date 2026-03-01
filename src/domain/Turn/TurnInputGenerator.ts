import { Axis, CellIndex } from '../Layout/Layout.js';
import { Letter, LetterTiles, TileId } from '../Inventory/Inventory.js';
import { Placement, TurnInput, TurnStateType } from './Turn.js';
import { LayoutCellUsabilityCalculator } from '../Layout/LayoutCellUsabilityCalculator.js';
import { TurnStateComputer } from './TurnStateComputer.js';
import { FrozenNode } from '../Dictionary/Dictionary.js';
import { Player } from '../Player.js';

type InputComputerConfig = { axis: Axis; targetCell: CellIndex };

type EnterFrame = {
  stage: Stage.Enter;
  phase: Phase;
  node: FrozenNode;
  position: number;
};

type AdvanceFrame = {
  stage: Stage.Advance;
  phase: Phase;
  node: FrozenNode;
  position: number;
  step: -1 | 1;
};

type ExpandFrame = {
  stage: Stage.Expand;
  phase: Phase;
  node: FrozenNode;
  position: number;
  step: -1 | 1;
  nextPosition: number;
  nextCell: CellIndex;
  iterator: Iterator<[Letter, FrozenNode]>;
  usableLetters: ReadonlySet<Letter>;
};

type BacktrackFrame = {
  stage: Stage.Backtrack;
  letter: Letter;
  placedTile: TileId;
};

type Frame = EnterFrame | AdvanceFrame | ExpandFrame | BacktrackFrame;

type CalculatorArgs = { axis: Axis; cell: CellIndex };

enum Phase {
  Left = 'Left',
  Right = 'Right',
}

enum Stage {
  Enter = 'Enter',
  Advance = 'Advance',
  Expand = 'Expand',
  Backtrack = 'Backtrack',
}

export class TurnInputGenerator {
  static execute(player: Player, dependencies: Dependencies): TurnInput | null {
    const { layout, inventory, turnManager } = dependencies;
    const playerLetterTiles = inventory.getletterTilesFor(player);
    if (playerLetterTiles.size === 0) return null;
    const availableTargetCells = new LayoutCellUsabilityCalculator(layout, turnManager).getAllUsableAsFirst();
    if (availableTargetCells.length === 0) return null;
    const calculator = new UsableLettersCalculator(dependencies);
    for (const targetCell of availableTargetCells) {
      for (const axis of Object.values(Axis)) {
        const config: InputComputerConfig = { targetCell, axis };
        const input = new TurnInputGenerator.InputComputer(dependencies, calculator).execute({
          playerLetterTiles,
          config,
        });
        if (input) return input;
      }
    }
    return null;
  }

  static InputComputer = class {
    constructor(
      private readonly dependencies: Dependencies,
      private readonly calculator: UsableLettersCalculator,
    ) {}

    private get layout() {
      return this.dependencies.layout;
    }
    private get dictionary() {
      return this.dependencies.dictionary;
    }
    private get inventory() {
      return this.dependencies.inventory;
    }
    private get turnManager() {
      return this.dependencies.turnManager;
    }

    execute({
      playerLetterTiles,
      config,
    }: {
      playerLetterTiles: LetterTiles;
      config: InputComputerConfig;
    }): TurnInput | null {
      const tiles = playerLetterTiles;
      const axisCells = this.layout.getAxisCells(config);
      const oppositeAxis = this.layout.getOppositeAxis(config.axis);
      const startPosition = axisCells.indexOf(config.targetCell);
      if (startPosition === -1) return null;
      const placement: Placement = [];
      const stack: Array<Frame> = [
        { stage: Stage.Enter, phase: Phase.Left, node: this.dictionary.rootNode, position: startPosition },
      ];
      while (stack.length > 0) {
        const frame = stack.pop()!;
        if (frame.stage === Stage.Enter) {
          const validResultIsPossible = placement.length > 0 && frame.node.isFinal;
          if (frame.phase === Phase.Right && validResultIsPossible) {
            const input: TurnInput = { initPlacement: [...placement] };
            const inputState = TurnStateComputer.execute(input, this.dependencies);
            if (inputState.type === TurnStateType.Valid) return input;
          }
        }
        if (frame.stage === Stage.Enter) this.enter(stack, frame);
        if (frame.stage === Stage.Advance) this.advance(stack, frame, axisCells, oppositeAxis);
        if (frame.stage === Stage.Expand) this.expand(stack, frame, tiles, placement);
        if (frame.stage === Stage.Backtrack) this.backtrack(frame, tiles, placement);
      }
      return null;
    }

    enter(stack: Array<Frame>, frame: EnterFrame): void {
      const { phase } = frame;
      if (phase === Phase.Left) {
        stack.push({ ...frame, stage: Stage.Enter, phase: Phase.Right });
        stack.push({ ...frame, stage: Stage.Advance, phase: Phase.Left, step: -1 });
      } else if (phase === Phase.Right) {
        stack.push({ ...frame, stage: Stage.Advance, phase: Phase.Right, step: 1 });
      }
    }

    advance(stack: Array<Frame>, frame: AdvanceFrame, axisCells: ReadonlyArray<CellIndex>, oppositeAxis: Axis): void {
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
          usableLetters: this.calculator.getFor({ axis: oppositeAxis, cell: nextCell }),
        });
      }
    }

    expand(stack: Array<Frame>, frame: ExpandFrame, tiles: LetterTiles, placement: Placement): void {
      const { phase, nextPosition, nextCell, iterator, usableLetters } = frame;
      const next = iterator.next();
      if (next.done) return;
      const [letter, nextNode] = next.value;
      stack.push(frame);
      if (!usableLetters.has(letter)) return;
      const tilesWithLetter = tiles.get(letter);
      if (!tilesWithLetter || tilesWithLetter.length === 0) return;
      const tile = tilesWithLetter.pop();
      if (!tile) throw new Error('Tile has to exist');
      placement.push({ cell: nextCell, tile });
      stack.push({ stage: Stage.Backtrack, letter, placedTile: tile });
      stack.push({ stage: Stage.Enter, phase, node: nextNode, position: nextPosition });
    }

    backtrack(frame: BacktrackFrame, tiles: LetterTiles, placement: Placement): void {
      const { letter, placedTile } = frame;
      const tilesWithLetter = tiles.get(letter);
      if (!tilesWithLetter) throw new Error('Backtracked letter has to exist');
      tilesWithLetter.push(placedTile);
      placement.pop();
    }
  };
}

class UsableLettersCalculator {
  private cache = new Map<Axis, Map<CellIndex, ReadonlySet<Letter>>>(
    Object.values(Axis).map(axis => [axis, new Map()]),
  );

  constructor(private readonly dependencies: Dependencies) {}

  private get layout() {
    return this.dependencies.layout;
  }
  private get dictionary() {
    return this.dependencies.dictionary;
  }
  private get inventory() {
    return this.dependencies.inventory;
  }
  private get turnManager() {
    return this.dependencies.turnManager;
  }

  getFor({ axis, cell }: CalculatorArgs): ReadonlySet<Letter> {
    const axisCache = this.cache.get(axis)!;
    const cachedResult = axisCache.get(cell);
    if (cachedResult) return cachedResult;
    const newResult = this.calculateFor({ axis, cell });
    axisCache.set(cell, newResult);
    return newResult;
  }

  // TODO to service ?
  private calculateFor({ axis, cell }: CalculatorArgs): ReadonlySet<Letter> {
    const axisCells = this.layout.getAxisCells({ axis, targetCell: cell });
    const cellAxisPosition = axisCells.indexOf(cell);
    const prefix = this.getPrefix(axisCells, cellAxisPosition);
    const suffix = this.getSuffix(axisCells, cellAxisPosition);
    if (!prefix && !suffix) return this.dictionary.allLetters;
    const prefixNode = prefix ? this.dictionary.getNodeFor(prefix) : this.dictionary.rootNode;
    if (!prefixNode) return new Set();
    const usableLetters = new Set<Letter>();
    for (const [letter, childNode] of prefixNode.children) {
      if (!suffix) {
        usableLetters.add(letter);
        continue;
      }
      const suffixNode = this.dictionary.getNodeFor(suffix, childNode);
      if (suffixNode && suffixNode.isFinal) usableLetters.add(letter);
    }
    return usableLetters;
  }

  private getPrefix(axisCells: ReadonlyArray<CellIndex>, cellAxisPosition: number): string {
    let prefix = '';
    for (let i = cellAxisPosition - 1; i >= 0; i--) {
      const tile = this.turnManager.findTileByCell(axisCells[i]);
      if (!tile) break;
      prefix = this.inventory.getTileLetter(tile) + prefix;
    }
    return prefix;
  }

  private getSuffix(axisCells: ReadonlyArray<CellIndex>, cellAxisPosition: number): string {
    let suffix = '';
    for (let i = cellAxisPosition + 1; i < axisCells.length; i++) {
      const tile = this.turnManager.findTileByCell(axisCells[i]);
      if (!tile) break;
      suffix += this.inventory.getTileLetter(tile);
    }
    return suffix;
  }
}

import { getRandomInt, shuffleArrayWithFisherYates } from '@/shared/helpers.js';
import { Axis, CellIndex, Layout } from '../Layout/Layout.js';
import { TileId } from '../Inventory.js';
import { Placement, TurnInput, TurnManager, TurnStateType } from './Turn.js';
import { LayoutCellUsabilityCalculator } from '../Layout/LayoutCellUsabilityCalculator.js';
import { LayoutSnippetFactory } from '../Layout/LayoutSnippetFactory.js';
import { TurnStateComputer } from './TurnStateComputer.js';

type InputBuilderConfig = [targetCell: CellIndex, axis: Axis, tileSequence: ReadonlyArray<TileId>];

export class TurnInputGenerator {
  constructor(private readonly dependencies: Dependencies) {}

  generate({ playerTiles }: { playerTiles: ReadonlyArray<TileId> }): TurnInput | null {
    if (playerTiles.length === 0) return null;
    const availableTargetCells = this.getAvailableTargetCells();
    if (availableTargetCells.length === 0) return null;
    const axes = Object.values(Axis);
    const playerTileCombinations = this.generatePlayerTileCombinations(playerTiles);
    const indexer = new CartesianProductIndexer([availableTargetCells, axes, playerTileCombinations] as const);
    while (true) {
      const config = indexer.nextInto();
      if (config === null) break;
      const input = this.buildInputFromConfig(config);
      if (input) {
        const state = new TurnStateComputer(this.dependencies).compute(input);
        if (state.type === TurnStateType.Valid) return input;
      }
    }
    return null;
  }

  private getAvailableTargetCells(): ReadonlyArray<CellIndex> {
    const { layout, turnManager } = this.dependencies;
    return new LayoutCellUsabilityCalculator(layout, turnManager).getAllUsableAsFirst();
  }

  private generatePlayerTileCombinations(playerTiles: ReadonlyArray<TileId>): ReadonlyArray<ReadonlyArray<TileId>> {
    const { dictionary } = this.dependencies;
    const combinations: Array<ReadonlyArray<TileId>> = [];
    const helper = (start: number, combo: ReadonlyArray<TileId>) => {
      for (let i = start; i < playerTiles.length; i++) {
        const newCombo = [...combo, playerTiles[i]];
        combinations.push(newCombo);
        helper(i + 1, newCombo);
      }
    };
    helper(0, []);
    return combinations.filter(combo => combo.length === 1 || dictionary.hasSubstring(combo.join('')));
  }

  private buildInputFromConfig(config: InputBuilderConfig): TurnInput | null {
    const [targetCell, axis, tileSequence] = config;
    const { length } = tileSequence;
    const { layout, turnManager } = this.dependencies;
    // TODO optimize
    const snippets = new LayoutSnippetFactory(turnManager).create({
      cells: layout.getAxisCells({ axis, targetCell }),
      targetCell,
      maxLength: length,
    });
    if (snippets.length === 0) return null;
    const cells = snippets[getRandomInt({ to: snippets.length - 1 })];
    if (cells === null) return null;
    const initPlacement = cells.map((cell: CellIndex, idx: number) => ({ cell, tile: tileSequence[idx] }));
    return { initPlacement };
  }
}

class CartesianProductIndexer<Arrays extends Array<ReadonlyArray<unknown>>> {
  private readonly arrays: Arrays;
  private readonly lengths: Array<number>;
  private readonly indices: Array<number>;
  private readonly buffer: { [K in keyof Arrays]: Arrays[K] extends ReadonlyArray<infer U> ? U : never };
  private readonly totalCombinations: number;
  private sequentialIndex = 0;

  constructor(arrayList: Arrays) {
    if (arrayList.length === 0) throw new Error('Must provide at least one array');
    for (const array of arrayList) if (array.length === 0) throw new Error('Arrays must not be empty');
    this.arrays = arrayList;
    this.lengths = arrayList.map(a => a.length);
    this.indices = new Array(arrayList.length).fill(0);
    this.buffer = arrayList.map(a => a[0]) as typeof this.buffer;
    this.totalCombinations = this.lengths.reduce((acc, len) => acc * len, 1);
  }

  nextInto(): typeof this.buffer | null {
    if (this.sequentialIndex >= this.totalCombinations) return null;
    for (let i = 0; i < this.arrays.length; i++) {
      this.buffer[i] = this.arrays[i][this.indices[i]];
    }
    // odometer increment
    for (let i = 0; i < this.indices.length; i++) {
      this.indices[i]++;
      if (this.indices[i] < this.lengths[i]) break;
      this.indices[i] = 0;
    }
    this.sequentialIndex++;
    return this.buffer;
  }
}

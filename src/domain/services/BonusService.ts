import LayoutService from '@/domain/services/LayoutService.ts';
import ShuffleService from '@/domain/services/ShuffleService.ts';
import { BoardBonus, BoardType } from '@/domain/value-objects/enums.ts';
import type { BoardBonusDistribution, BoardCell } from '@/domain/value-objects/types.ts';

type OctantLocation = readonly [row: number, col: number];

// Octant is an upper-left slice of the board depicted on illustration below. The 8 D4 symmetries (4 rotations + 4 reflections) expand it to the full layout:

// [0,0] .     .     .     .     .     .     .     .     .     .     .     .     .     .
// [1,0] [1,1] .     .     .     .     .     .     .     .     .     .     .     .     .
// [2,0] [2,1] [2,2] .     .     .     .     .     .     .     .     .     .     .     .
// [3,0] [3,1] [3,2] [3,3] .     .     .     .     .     .     .     .     .     .     .
// [4,0] [4,1] [4,2] [4,3] [4,4] .     .     .     .     .     .     .     .     .     .
// [5,0] [5,1] [5,2] [5,3] [5,4] [5,5] .     .     .     .     .     .     .     .     .
// [6,0] [6,1] [6,2] [6,3] [6,4] [6,5] [6,6] .     .     .     .     .     .     .     .
// [7,0] [7,1] [7,2] [7,3] [7,4] [7,5] [7,6] *     .     .     .     .     .     .     .   (* = center)
// .     .     .     .     .     .     .     .     .     .     .     .     .     .     .
// .     .     .     .     .     .     .     .     .     .     .     .     .     .     .
// .     .     .     .     .     .     .     .     .     .     .     .     .     .     .
// .     .     .     .     .     .     .     .     .     .     .     .     .     .     .
// .     .     .     .     .     .     .     .     .     .     .     .     .     .     .
// .     .     .     .     .     .     .     .     .     .     .     .     .     .     .
// .     .     .     .     .     .     .     .     .     .     .     .     .     .     .

export default class BonusService {
  private static readonly NON_CENTER_CELLS: ReadonlyArray<BoardCell> = LayoutService.CELLS.filter(
    cell => cell !== LayoutService.CENTER_CELL,
  );

  private static readonly PRESET_OCTANT_LOCATIONS_BY_BONUS: ReadonlyMap<BoardBonus, ReadonlyArray<OctantLocation>> = new Map([
    [
      BoardBonus.DoubleLetter,
      [
        [3, 0],
        [6, 2],
        [6, 6],
        [7, 3],
      ],
    ],
    [
      BoardBonus.DoubleWord,
      [
        [1, 1],
        [2, 2],
        [3, 3],
        [4, 4],
      ],
    ],
    [
      BoardBonus.TripleLetter,
      [
        [5, 1],
        [5, 5],
      ],
    ],
    [
      BoardBonus.TripleWord,
      [
        [0, 0],
        [7, 0],
      ],
    ],
  ]);

  private static readonly PRESET_DISTRIBUTION: BoardBonusDistribution = (() => {
    const result = new Map<BoardCell, BoardBonus>();
    for (const [bonus, locations] of this.PRESET_OCTANT_LOCATIONS_BY_BONUS) {
      for (const location of locations) {
        for (const cell of this.getSymmetricCells(location)) result.set(cell, bonus);
      }
    }
    return result;
  })();

  static createDistribution(type: BoardType, randomizerFunction?: () => number): BoardBonusDistribution {
    switch (type) {
      case BoardType.Preset:
        return this.PRESET_DISTRIBUTION;
      case BoardType.Random:
        return this.createRandomDistribution(randomizerFunction);
      default:
        throw new ReferenceError(`unexpected board type: ${String(type)}`);
    }
  }

  private static createRandomDistribution(randomizerFunction: () => number = Math.random): BoardBonusDistribution {
    const cells = [...this.NON_CENTER_CELLS];
    ShuffleService.shuffle({ array: cells, randomizerFunction });
    const bonuses = [...this.PRESET_DISTRIBUTION.values()];
    const result = new Map<BoardCell, BoardBonus>();
    for (let idx = 0; idx < bonuses.length; idx++) {
      const cell = cells[idx];
      const bonus = bonuses[idx];
      if (cell === undefined || bonus === undefined) break;
      result.set(cell, bonus);
    }
    return result;
  }

  private static getSymmetricCells([row, col]: OctantLocation): ReadonlySet<BoardCell> {
    const size = LayoutService.CELLS_PER_AXIS;
    const last = size - 1;
    const reflections: ReadonlyArray<OctantLocation> = [
      [row, col],
      [row, last - col],
      [last - row, col],
      [last - row, last - col],
      [col, row],
      [col, last - row],
      [last - col, row],
      [last - col, last - row],
    ];
    const cells = new Set<BoardCell>();
    for (const [rowIdx, colIdx] of reflections) cells.add((rowIdx * size + colIdx) as BoardCell);
    return cells;
  }
}

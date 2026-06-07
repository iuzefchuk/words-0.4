import PlayfieldLayoutService from '@/domain/services/PlayfieldLayoutService.ts';
import ShuffleService from '@/domain/services/ShuffleService.ts';
import { PlayfieldBonus, PlayfieldType } from '@/domain/value-objects/enums.ts';
import type { PlayfieldBonusDistribution, PlayfieldCell } from '@/domain/value-objects/types.ts';

type OctantLocation = readonly [row: number, col: number];

// Octant is an upper-left slice of the playfield depicted on illustration below. The 8 D4 symmetries (4 rotations + 4 reflections) expand it to the full layout:

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

export default class PlayfieldBonusService {
  private static readonly NON_CENTER_CELLS: ReadonlyArray<PlayfieldCell> = PlayfieldLayoutService.CELLS.filter(
    cell => cell !== PlayfieldLayoutService.CENTER_CELL,
  );

  private static readonly PRESET_OCTANT_LOCATIONS_BY_BONUS: ReadonlyMap<PlayfieldBonus, ReadonlyArray<OctantLocation>> = new Map([
    [
      PlayfieldBonus.DoubleLetter,
      [
        [3, 0],
        [6, 2],
        [6, 6],
        [7, 3],
      ],
    ],
    [
      PlayfieldBonus.DoubleWord,
      [
        [1, 1],
        [2, 2],
        [3, 3],
        [4, 4],
      ],
    ],
    [
      PlayfieldBonus.TripleLetter,
      [
        [5, 1],
        [5, 5],
      ],
    ],
    [
      PlayfieldBonus.TripleWord,
      [
        [0, 0],
        [7, 0],
      ],
    ],
  ]);

  private static readonly PRESET_DISTRIBUTION: PlayfieldBonusDistribution = (() => {
    const result = new Map<PlayfieldCell, PlayfieldBonus>();
    for (const [bonus, locations] of this.PRESET_OCTANT_LOCATIONS_BY_BONUS) {
      for (const location of locations) {
        for (const cell of this.getSymmetricCells(location)) result.set(cell, bonus);
      }
    }
    return result;
  })();

  static createDistribution(type: PlayfieldType, randomizerFunction?: () => number): PlayfieldBonusDistribution {
    switch (type) {
      case PlayfieldType.Preset:
        return this.PRESET_DISTRIBUTION;
      case PlayfieldType.Random:
        return this.createRandomDistribution(randomizerFunction);
      default:
        throw new ReferenceError(`unexpected playfield type: ${String(type)}`);
    }
  }

  private static createRandomDistribution(randomizerFunction: () => number = Math.random): PlayfieldBonusDistribution {
    const cells = [...this.NON_CENTER_CELLS];
    ShuffleService.shuffle({ array: cells, randomizerFunction });
    const bonuses = [...this.PRESET_DISTRIBUTION.values()];
    const result = new Map<PlayfieldCell, PlayfieldBonus>();
    for (let idx = 0; idx < bonuses.length; idx++) {
      const cell = cells[idx];
      const bonus = bonuses[idx];
      if (cell === undefined || bonus === undefined) break;
      result.set(cell, bonus);
    }
    return result;
  }

  private static getSymmetricCells([row, col]: OctantLocation): ReadonlySet<PlayfieldCell> {
    const size = PlayfieldLayoutService.CELLS_PER_AXIS;
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
    const cells = new Set<PlayfieldCell>();
    for (const [rowIdx, colIdx] of reflections) cells.add((rowIdx * size + colIdx) as PlayfieldCell);
    return cells;
  }
}

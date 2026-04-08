import { Cell, Placement } from '@/domain/models/board/types.ts';
import { Tile } from '@/domain/models/inventory/types.ts';

export default class ScoringService {
  static execute(
    placements: ReadonlyArray<Placement>,
    newCells: ReadonlySet<Cell>,
    getTilePoints: (tile: Tile) => number,
    getMultiplierForLetter: (cell: Cell) => number,
    getMultiplierForWord: (cell: Cell) => number,
  ): number {
    let totalScore = 0;
    for (const placement of placements) {
      let score = 0;
      let multiplier = 1;
      for (const { cell, tile } of placement) {
        const tileIsNew = newCells.has(cell);
        score += getTilePoints(tile) * (tileIsNew ? getMultiplierForLetter(cell) : 1);
        multiplier *= tileIsNew ? getMultiplierForWord(cell) : 1;
      }
      totalScore += score * multiplier;
    }
    return totalScore;
  }
}

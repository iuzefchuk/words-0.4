import { CellIndex, Placement } from '@/domain/models/Board.ts';
import { TileId } from '@/domain/models/Inventory.ts';

export default class ScoreCalculator {
  static execute(
    placements: ReadonlyArray<Placement>,
    newCells: ReadonlySet<CellIndex>,
    getTilePoints: (tile: TileId) => number,
    getLetterMultiplier: (cell: CellIndex) => number,
    getWordMultiplier: (cell: CellIndex) => number,
  ): number {
    let totalScore = 0;
    for (const placement of placements) {
      let score = 0;
      let multiplier = 1;
      for (const { cell, tile } of placement) {
        const tileIsNew = newCells.has(cell);
        score += getTilePoints(tile) * (tileIsNew ? getLetterMultiplier(cell) : 1);
        multiplier *= tileIsNew ? getWordMultiplier(cell) : 1;
      }
      totalScore += score * multiplier;
    }
    return totalScore;
  }
}

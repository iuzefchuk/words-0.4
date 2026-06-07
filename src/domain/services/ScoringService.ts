import type { BoardCell, BoardPlacement, InventoryTile } from '@/domain/value-objects/types.ts';

export default class ScoringService {
  static execute(
    placements: ReadonlyArray<BoardPlacement>,
    newCells: ReadonlySet<BoardCell>,
    getTilePoints: (tile: InventoryTile) => number,
    getMultiplierForLetter: (cell: BoardCell) => number,
    getMultiplierForWord: (cell: BoardCell) => number,
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

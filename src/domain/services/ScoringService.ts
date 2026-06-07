import type { InventoryTile, PlayfieldCell, PlayfieldPlacement } from '@/domain/value-objects/types.ts';

export default class ScoringService {
  static execute(
    placements: ReadonlyArray<PlayfieldPlacement>,
    newCells: ReadonlySet<PlayfieldCell>,
    getTilePoints: (tile: InventoryTile) => number,
    getMultiplierForLetter: (cell: PlayfieldCell) => number,
    getMultiplierForWord: (cell: PlayfieldCell) => number,
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

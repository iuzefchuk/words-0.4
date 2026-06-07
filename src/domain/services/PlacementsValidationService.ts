import { TurnValidationError } from '@/domain/value-objects/enums.ts';
import type { BoardAxis } from '@/domain/value-objects/enums.ts';
import type { BoardAnchorCoordinates, BoardCell, BoardPlacement, InventoryTile } from '@/domain/value-objects/types.ts';

export default class PlacementsValidationService {
  static execute(
    tiles: ReadonlyArray<InventoryTile>,
    cells: ReadonlyArray<BoardCell>,
    calculateAxis: (cells: ReadonlyArray<BoardCell>) => BoardAxis | null,
    buildPlacement: (coords: BoardAnchorCoordinates, tiles: ReadonlyArray<InventoryTile>) => BoardPlacement,
    getOppositeAxis: (axis: BoardAxis) => BoardAxis,
    findTileByCell: (cell: BoardCell) => InventoryTile | undefined,
  ): ReadonlyArray<BoardPlacement> | TurnValidationError {
    const primaryAxis = calculateAxis(cells);
    if (primaryAxis === null) return TurnValidationError.InvalidTilePlacement;
    const cell = cells[0];
    if (cell === undefined) throw new ReferenceError('expected first cell, got undefined');
    const coords = { axis: primaryAxis, cell };
    const primaryPlacement = buildPlacement(coords, tiles);
    const areLinksUsable = (placement: BoardPlacement): boolean => placement.length > 1;
    if (!areLinksUsable(primaryPlacement)) return TurnValidationError.InvalidTilePlacement;
    const result: Array<BoardPlacement> = [primaryPlacement];
    for (const cell of cells) {
      const coords: BoardAnchorCoordinates = { axis: getOppositeAxis(primaryAxis), cell };
      const tile = findTileByCell(cell);
      if (tile === undefined) continue;
      const secondaryPlacement = buildPlacement(coords, [tile]);
      if (areLinksUsable(secondaryPlacement)) result.push(secondaryPlacement);
    }
    return result;
  }
}
